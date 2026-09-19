import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { FaBasketShopping } from "react-icons/fa6";

import './Navbar.css';


const Navbar = ({ variant = 'home' }) => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('dark');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hideNavbar, setHideNavbar] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.body.setAttribute('data-theme', savedTheme);

    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > 10 && currentScrollY > lastScrollY) {
        setHideNavbar(true); // scrolling down
      } else {
        setHideNavbar(false); // scrolling up
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.body.setAttribute('data-theme', newTheme);
  };

const handleLogout = () => {
  localStorage.removeItem('token');
  setIsLoggedIn(false);
  setTimeout(() => {
    navigate('/');
  }, 300);
};


  return (
    <div className={`navbar ${hideNavbar ? 'hide-navbar' : ''}`}>
      <div className="navbar-left">
        <h1 className="logo" onClick={() => navigate('/')}>AgroLink</h1>
        <ul>
          {variant === 'home' && (
            <>
              <li onClick={() => navigate('/home')}>Home</li>
              <li>About</li>
              <li>Services</li>
              <li>Contact</li>
            </>
          )}
          {variant === 'products' && (
            <>
              <li onClick={() => navigate('/home')}>Home</li>
              <li onClick={() => navigate('/products')}>Products</li>
              <li onClick={() => navigate('/profile')}>Profile</li>
            </>
          )}
          {variant === 'profile' && (
            <>
              <li onClick={() => navigate('/home')}>Home</li>
              <li onClick={() => navigate('/products')}>Products</li>
              <li onClick={() => navigate('/profile')}>Profile</li>
            </>
          )}

        </ul>
      </div>


      <div className="navbar-right">

        {variant === 'products' && (
          <button className="cart-btn-nav" onClick={() => navigate('/cart')}>
              <FaBasketShopping className="cart-icon" />
          </button>)}

        <button onClick={toggleTheme} className="theme-toggle">
          {theme === 'dark' ? '🌞 Light' : '🌙 Dark'}
        </button>

              {!isLoggedIn ? (
            <button className="login-btn" onClick={() => navigate('/login')}>
              Login
            </button>
          ) : (
            <button className="logout-btn" onClick={handleLogout}>
              Logout
          </button>
          )}

      </div>
    </div>
  );
};

export default Navbar;
