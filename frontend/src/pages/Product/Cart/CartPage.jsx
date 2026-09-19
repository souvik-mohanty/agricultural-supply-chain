import React, { useEffect, useState } from 'react';
import { getCart, getProductById, addToCart, removeFromCart } from '../../../service/productApi';
import Navbar from '../../../components/Navbar/Navbar';
import QuantityCounter from '../../../components/quantityCounter/quantityCounter';
import './CartPage.css';

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);

  // 🔄 Load cart items on mount
  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await getCart();
      const cart = response.data;

      const itemsWithDetails = await Promise.all(
        cart.items.map(async (item) => {
          const productRes = await getProductById(item.productId);
          return {
            ...item,
            ...productRes.data,
          };
        })
      );

      setCartItems(itemsWithDetails);
      setTotal(cart.total);
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  // ➕ Increase quantity
  const handleIncrease = async (productId) => {
    try {
      await addToCart(productId, 1);
      fetchCart(); // refresh after update
    } catch (err) {
      console.error('Error increasing quantity:', err);
    }
  };

  // ➖ Decrease quantity
  const handleDecrease = async (productId, currentQuantity) => {
    try {
      if (currentQuantity > 1) {
        await removeFromCart(productId, 1);
      } else {
        await removeFromCart(productId); // remove completely
      }
      fetchCart(); // refresh after update
    } catch (err) {
      console.error('Error decreasing quantity:', err);
    }
  };

  // ❌ Remove entire item
  const handleRemove = async (productId) => {
    try {
      await removeFromCart(productId); // remove all quantities
      fetchCart();
    } catch (err) {
      console.error('Error removing item:', err);
    }
  };

  return (
    <>
      <Navbar variant="products" />
      <div className="cart-page">
        <div className="cart-left">
          <h2>Shopping Cart</h2>
          {cartItems.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            cartItems.map((item, index) => (
              <div key={index} className="cart-item">
                <img
                  src={item.imageUrl || 'https://via.placeholder.com/120'}
                  alt={item.name}
                  className="cart-item-image"
                />
                <div className="cart-item-details">
                  <h3>{item.name}</h3>
                  <p>Price: ₹{item.priceAtAddTime}</p>
                  <p><strong>Subtotal:</strong> ₹{(item.priceAtAddTime * item.quantity).toFixed(2)}</p>

                  <div className='cart-buttons'>
                    <QuantityCounter
                      quantity={item.quantity}
                      onIncrease={() => handleIncrease(item.productId)}
                      onDecrease={() => handleDecrease(item.productId, item.quantity)}
                    />
                    <button className="remove-btn" onClick={() => handleRemove(item.productId)}>Remove</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-right">
          <div className="cart-summary">
            {cartItems.map((item, index) => (
              <p key={index}>
                {item.name}: ₹{item.priceAtAddTime} × {item.quantity} = ₹
                {(item.priceAtAddTime * item.quantity).toFixed(2)}
              </p>
            ))}
            <h3>Subtotal ({cartItems.length} items): ₹ {total.toFixed(2)}</h3>
            <button className="checkout-btn">Proceed to Buy</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CartPage;
