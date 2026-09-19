import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ProductCard.css';

const ProductCard = ({ product, onAddToCart, onBuyNow }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/products/${product.id}`);
  };

  return (
    <div className="product-card" onClick={handleCardClick}>
      <img
        className="product-image"
        src={product.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'}
        alt={product.name}
        onError={(e) => { e.target.src = 'https://placehold.co/300x200/555/white?text=No+Image'; }}
      />
      <div className="product-details">
        <div className="product-info">
          <h3 className="product-title">{product.name}</h3>
        </div>
        <div>
          <p className="product-price">
            ₹{product.pricePerUnit} <span className="unit-label">/ Unit</span>
          </p>

          <div className="product-actions" onClick={e => e.stopPropagation()}>
            <button className="btn add-cart" onClick={() => onAddToCart(product)}>Add to Cart</button>
            <button className="btn buy-now" onClick={() => onBuyNow(product)}>Buy Now</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
