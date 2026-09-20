import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import PageLayout from '../../../components/ui/PageLayout';
import Notice from '../../../components/ui/Notice';
import { EmptyState, QueryBoundary } from '../../../components/ui/PageState';
import { useCart } from '../../../hooks/useApiData';
import { addToCart, removeFromCart } from '../../../service/cartApi';
import { getProductById, productImageUrl } from '../../../service/productApi';
import { buyCart } from '../../../service/checkout';
import { getErrorMessage } from '../../../lib/errors';
import { formatCurrency } from '../../../lib/format';
import { keys } from '../../../lib/queryKeys';
import './CartPage.css';

// Cart lines only hold ids and prices; names and photos come from the catalogue.
const useLineProducts = (items) =>
  useQueries({
    queries: items.map((item) => ({
      queryKey: keys.product(item.productId),
      queryFn: async () => (await getProductById(item.productId)).data,
    })),
  });

const CartLines = ({ cart, onChange, onRemove, busy }) => {
  const products = useLineProducts(cart.items);
  return (
    <ul className="cart-lines">
      {cart.items.map((item, index) => {
        const product = products[index]?.data;
        const missing = products[index]?.isError;
        const image = product ? productImageUrl(product) : null;
        return (
          <li key={item.productId} className="cart-line ui-card">
            {image ? <img src={image} alt="" /> : <div className="mk-noimg cart-thumb" aria-hidden="true" />}
            <div className="cart-line-info">
              <h3>{product ? <Link to={`/products/${product.id}`}>{product.name}</Link> : missing ? 'Product no longer available' : 'Loading…'}</h3>
              <p className="mk-meta">
                {formatCurrency(item.priceAtAddTime)} each · Subtotal {formatCurrency(item.priceAtAddTime * item.quantity)}
              </p>
              {missing && <p className="ui-error">This product was removed by its seller. Remove it to continue.</p>}
            </div>
            <div className="cart-line-controls">
              <div className="cart-qty" role="group" aria-label={`Quantity of ${product?.name ?? 'item'}`}>
                <button type="button" className="ui-btn ghost small" onClick={() => onChange(item, -1)} disabled={busy} aria-label="Decrease quantity">
                  −
                </button>
                <span aria-live="polite">{item.quantity}</span>
                <button
                  type="button"
                  className="ui-btn ghost small"
                  onClick={() => onChange(item, 1)}
                  disabled={busy || missing || (product && item.quantity >= product.quantityAvailable)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <button type="button" className="ui-btn danger small" onClick={() => onRemove(item)} disabled={busy}>
                Remove
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

const CartPage = () => {
  const queryClient = useQueryClient();
  const cartQuery = useCart();
  const [notice, setNotice] = useState(null); // { type, text }
  const [paying, setPaying] = useState(false);

  const refreshCart = () => queryClient.invalidateQueries({ queryKey: keys.cart });
  const failed = (error) => setNotice({ type: 'error', text: getErrorMessage(error) });

  const change = useMutation({
    mutationFn: ({ item, delta }) => (delta > 0 ? addToCart(item.productId, 1) : removeFromCart(item.productId, 1)),
    onSuccess: refreshCart,
    onError: failed,
  });
  const remove = useMutation({ mutationFn: (item) => removeFromCart(item.productId), onSuccess: refreshCart, onError: failed });
  const busy = change.isPending || remove.isPending;

  const handleCheckout = async () => {
    setNotice(null);
    setPaying(true);
    try {
      await buyCart();
      setNotice({ type: 'success', text: 'Payment successful. Your order has been placed.' });
      refreshCart();
      queryClient.invalidateQueries({ queryKey: keys.orders });
    } catch (error) {
      setNotice(
        error.message === 'Payment cancelled'
          ? { type: 'info', text: 'Payment cancelled. Nothing was charged; the reserved stock is released shortly.' }
          : { type: 'error', text: getErrorMessage(error, 'Checkout failed.') },
      );
    } finally {
      setPaying(false);
    }
  };

  return (
    <PageLayout title="Shopping cart">
      <Notice type={notice?.type}>{notice?.text}</Notice>
      <QueryBoundary
        query={cartQuery}
        isEmpty={(cart) => cart.items.length === 0}
        empty={
          <EmptyState
            title="Your cart is empty"
            message="Add products from the marketplace to check out."
            action={<Link className="ui-btn primary" to="/products">Browse products</Link>}
          />
        }
      >
        {(cart) => (
          <div className="cart-layout">
            <CartLines
              cart={cart}
              busy={busy || paying}
              onChange={(item, delta) => change.mutate({ item, delta })}
              onRemove={(item) => remove.mutate(item)}
            />
            <aside className="ui-card cart-summary" aria-label="Order summary">
              <h2>Summary</h2>
              <p>
                {cart.items.length} item{cart.items.length === 1 ? '' : 's'}
              </p>
              <p className="cart-total">{formatCurrency(cart.total)}</p>
              <button type="button" className="ui-btn primary" onClick={handleCheckout} disabled={paying || busy}>
                {paying ? 'Processing…' : 'Proceed to pay'}
              </button>
              <p className="ui-hint">Stock is reserved for 30 minutes while you pay. Prices are confirmed by the server at checkout.</p>
            </aside>
          </div>
        )}
      </QueryBoundary>
    </PageLayout>
  );
};

export default CartPage;
