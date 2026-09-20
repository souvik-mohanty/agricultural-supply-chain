import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PageLayout from '../../../components/ui/PageLayout';
import Notice from '../../../components/ui/Notice';
import { QueryBoundary } from '../../../components/ui/PageState';
import { useAuth } from '../../../auth/useAuth';
import { ROLES, isBuyerRole } from '../../../auth/roles';
import { useProduct } from '../../../hooks/useApiData';
import { addToCart } from '../../../service/cartApi';
import { productImageUrl } from '../../../service/productApi';
import { buyNow } from '../../../service/checkout';
import { getErrorMessage } from '../../../lib/errors';
import { formatCurrency } from '../../../lib/format';
import { keys } from '../../../lib/queryKeys';
import './ProductDetails.css';

const ProductDetails = () => {
  const { id } = useParams();
  const { isAuthenticated, role, user } = useAuth();
  const queryClient = useQueryClient();
  const productQuery = useProduct(id);
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState(null); // { type, text }
  const [paying, setPaying] = useState(false);

  const add = useMutation({
    mutationFn: (product) => addToCart(product.id, quantity),
    onSuccess: (_, product) => {
      queryClient.invalidateQueries({ queryKey: keys.cart });
      setFeedback({ type: 'success', text: `${quantity} × ${product.name} added to your cart.` });
    },
    onError: (error) => setFeedback({ type: 'error', text: getErrorMessage(error, 'Could not add the item to your cart.') }),
  });

  const handleBuyNow = async (product) => {
    setFeedback(null);
    setPaying(true);
    try {
      await buyNow(product.id, quantity);
      setFeedback({ type: 'success', text: 'Payment successful. Your order has been placed.' });
      queryClient.invalidateQueries({ queryKey: keys.product(product.id) });
      queryClient.invalidateQueries({ queryKey: keys.orders });
    } catch (error) {
      setFeedback(
        error.message === 'Payment cancelled'
          ? { type: 'info', text: 'Payment cancelled. Nothing was charged; the reserved stock is released shortly.' }
          : { type: 'error', text: getErrorMessage(error, 'Could not complete the purchase.') },
      );
    } finally {
      setPaying(false);
    }
  };

  return (
    <PageLayout>
      <p>
        <Link to="/products">← Back to the marketplace</Link>
      </p>
      <QueryBoundary query={productQuery} isEmpty={() => false}>
        {(product) => {
          const image = productImageUrl(product);
          const inStock = product.quantityAvailable > 0;
          const canOrder = isAuthenticated && isBuyerRole(role);
          const canEdit = isAuthenticated && (role === ROLES.ADMIN || (role === ROLES.FARMER && product.farmerId === user.id));

          return (
            <div className="pd-layout">
              <div className="pd-media">
                {image ? <img src={image} alt={product.name} /> : <div className="mk-noimg">No photo</div>}
              </div>

              <div className="ui-card">
                <h1 className="pd-title">{product.name}</h1>
                <p className="pd-price">
                  {formatCurrency(product.pricePerUnit)} <small>per unit</small>
                </p>

                <dl className="ui-kv">
                  <dt>Category</dt>
                  <dd>{product.category}</dd>
                  <dt>Availability</dt>
                  <dd>{inStock ? `${product.quantityAvailable} units available` : 'Out of stock'}</dd>
                  {product.qualityTag && (
                    <>
                      <dt>Quality</dt>
                      <dd>{product.qualityTag}</dd>
                    </>
                  )}
                  {product.cropInfo && (
                    <>
                      <dt>Crop details</dt>
                      <dd>{product.cropInfo}</dd>
                    </>
                  )}
                </dl>

                <Notice type={feedback?.type}>{feedback?.text}</Notice>

                {canOrder && (
                  <div className="pd-order">
                    <div className="ui-field pd-qty">
                      <label htmlFor="pd-qty">Quantity</label>
                      <input
                        id="pd-qty"
                        className="ui-input"
                        type="number"
                        min="1"
                        max={product.quantityAvailable}
                        value={quantity}
                        onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
                      />
                    </div>
                    <div className="pg-actions">
                      <button
                        type="button"
                        className="ui-btn primary"
                        onClick={() => handleBuyNow(product)}
                        disabled={!inStock || paying || quantity > product.quantityAvailable}
                      >
                        {paying ? 'Processing…' : 'Buy now'}
                      </button>
                      <button
                        type="button"
                        className="ui-btn ghost"
                        onClick={() => {
                          setFeedback(null);
                          add.mutate(product);
                        }}
                        disabled={!inStock || add.isPending || quantity > product.quantityAvailable}
                      >
                        {add.isPending ? 'Adding…' : 'Add to cart'}
                      </button>
                      <Link className="ui-btn ghost" to={`/rfqs/new?productId=${product.id}`}>
                        Request a quote
                      </Link>
                    </div>
                    <p className="ui-hint">Need a large quantity or a better price? Request a quote and the seller replies with an offer.</p>
                  </div>
                )}

                {!isAuthenticated && (
                  <p>
                    <Link className="ui-btn primary" to="/login" state={{ from: { pathname: `/products/${product.id}` } }}>
                      Log in to order
                    </Link>
                  </p>
                )}

                {canEdit && (
                  <p>
                    <Link className="ui-btn ghost" to={`/manage/products/${product.id}/edit`}>
                      Edit this product
                    </Link>
                  </p>
                )}
              </div>
            </div>
          );
        }}
      </QueryBoundary>
    </PageLayout>
  );
};

export default ProductDetails;
