import React from 'react';
import { Link } from 'react-router-dom';
import { productImageUrl } from '../../service/productApi';
import { formatCurrency } from '../../lib/format';

// One product in the marketplace grid. Only fields the backend provides are shown.
// `canOrder` = the viewer is a buyer; anonymous viewers are asked to log in instead.
const ProductCard = ({ product, canOrder, loggedIn, onAddToCart, adding }) => {
  const image = productImageUrl(product);
  const inStock = product.quantityAvailable > 0;

  return (
    <article className="mk-card">
      {image ? (
        <img src={image} alt={product.name} loading="lazy" />
      ) : (
        <div className="mk-noimg" aria-hidden="true">
          No photo
        </div>
      )}
      <div className="mk-body">
        <h3>
          <Link to={`/products/${product.id}`}>{product.name}</Link>
        </h3>
        <span className="mk-meta">{product.category}</span>
        <span className="mk-price">
          {formatCurrency(product.pricePerUnit)} <small className="mk-meta">per unit</small>
        </span>
        <span className="mk-meta">
          {inStock ? `${product.quantityAvailable} available` : <strong>Out of stock</strong>}
          {product.qualityTag ? ` · ${product.qualityTag}` : ''}
        </span>

        <div className="mk-actions">
          <Link className="ui-btn ghost small" to={`/products/${product.id}`}>
            View details
          </Link>
          {canOrder && (
            <button type="button" className="ui-btn primary small" onClick={() => onAddToCart(product)} disabled={!inStock || adding}>
              {adding ? 'Adding…' : 'Add to cart'}
            </button>
          )}
          {!loggedIn && (
            <Link className="ui-btn primary small" to="/login">
              Log in to order
            </Link>
          )}
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
