import React, { useEffect, useState } from 'react';
import { getProductById } from '../../../service/productApi';
import { getCart, addToCart, removeFromCart } from '../../../service/cartApi';
import { buyCart } from '../../../service/checkout';
import Navbar from '../../../components/Navbar/Navbar';
import QuantityCounter from '../../../components/quantityCounter/quantityCounter';
import './CartPage.css';

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [notice, setNotice] = useState(null); // { type: 'success' | 'error', text }
  const [checkingOut, setCheckingOut] = useState(false);

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

  // 💳 Pay for everything in the cart through Razorpay
  const handleCheckout = async () => {
    setNotice(null);
    setCheckingOut(true);
    try {
      await buyCart();
      setNotice({ type: 'success', text: 'Payment successful! Your order has been placed.' });
      fetchCart();
    } catch (err) {
      console.error('Checkout failed:', err);
      setNotice({ type: 'error', text: err.response?.data?.message || err.message || 'Checkout failed' });
    } finally {
      setCheckingOut(false);
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
            {notice && (
              <p style={{ color: notice.type === 'success' ? 'green' : 'red' }}>{notice.text}</p>
            )}
            <button
              className="checkout-btn"
              onClick={handleCheckout}
              disabled={checkingOut || cartItems.length === 0}
            >
              {checkingOut ? 'Processing...' : 'Proceed to Buy'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CartPage;
