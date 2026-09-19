import React from 'react';
import { FaMinus, FaPlus } from 'react-icons/fa';
import './quantityCounter.css';

const QuantityCounter = ({ quantity, onIncrease, onDecrease }) => {
  return (
    <div className="quantity-control">
      <button className="icon-btn" onClick={onDecrease}>
        <FaMinus />
      </button>
      <span className="count">{quantity}</span>
      <button className="icon-btn" onClick={onIncrease}>
        <FaPlus />
      </button>
    </div>
  );
};

export default QuantityCounter;
