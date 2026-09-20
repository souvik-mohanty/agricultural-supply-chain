import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FaBasketShopping, FaBell } from 'react-icons/fa6';
import { useAuth } from '../../auth/useAuth';
import { isBuyerRole, roleLabel } from '../../auth/roles';
import { navItemsFor } from '../../navigation/navItems';
import { getUnreadCount } from '../../service/notificationApi';
import { keys } from '../../lib/queryKeys';
import Logo from '../Logo/Logo';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role, user, logout } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [menuOpen, setMenuOpen] = useState(false);
  const [hideNavbar, setHideNavbar] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setHideNavbar(currentScrollY > 10 && currentScrollY > lastScrollY); // hide while scrolling down
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const unread = useQuery({
    queryKey: keys.unread,
    queryFn: async () => (await getUnreadCount()).data.count,
    enabled: isAuthenticated,
    refetchInterval: 60 * 1000,
  });

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  const closeMenu = () => setMenuOpen(false);
  const unreadCount = unread.data ?? 0;

  return (
    <nav className={`navbar ${hideNavbar && !menuOpen ? 'hide-navbar' : ''}`} aria-label="Main">
      <div className="navbar-left">
        <Link to="/" className="nav-brand" onClick={closeMenu} aria-label="AgroLink home">
          <Logo />
        </Link>
        <ul id="main-menu" className={menuOpen ? 'open' : ''}>
          {navItemsFor(role).map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} onClick={closeMenu}>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      <div className="navbar-right">
        {isAuthenticated && isBuyerRole(role) && (
          <Link to="/cart" className="cart-btn-nav" aria-label="Shopping cart" onClick={closeMenu}>
            <FaBasketShopping className="cart-icon" aria-hidden="true" />
          </Link>
        )}

        {isAuthenticated && (
          <Link
            to="/notifications"
            className="cart-btn-nav bell"
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
            onClick={closeMenu}
          >
            <FaBell className="cart-icon" aria-hidden="true" />
            {unreadCount > 0 && <span className="nav-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
          </Link>
        )}

        <button type="button" onClick={toggleTheme} className="theme-toggle" aria-label="Toggle light and dark theme">
          {theme === 'dark' ? '🌞 Light' : '🌙 Dark'}
        </button>

        {isAuthenticated ? (
          <>
            <Link to="/profile" className="nav-user" onClick={closeMenu} title="Your profile">
              <span>{user?.username}</span>
              <small>{roleLabel(role)}</small>
            </Link>
            <button type="button" className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <button type="button" className="login-btn" onClick={() => navigate('/login')}>
              Login
            </button>
            <button type="button" className="login-btn register" onClick={() => navigate('/register')}>
              Register
            </button>
          </>
        )}

        <button
          type="button"
          className="nav-toggle"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-controls="main-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          ☰
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
