import React from 'react';
import Home from '../pages/Home/Home';
import Login from '../pages/Auth/Login/Login';
import Register from '../pages/Auth/Register/Register';
import Landing from '../pages/Landing/Landing';
import PrivateRoute from './PrivateRoute';
import ComingSoon from '../pages/ComingSoon/ComingSoon';
import Update from '../pages/update/update';
import Profile from '../pages/Profile/Profile';
import ProductPage from '../pages/Product/ProductPages/ProductPage';
import ProductDetails from '../pages/Product/ProductDetails/ProductDetails';
import CartPage from '../pages/Product/Cart/CartPage';

const appRoutes = [
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/update-profile', element: <Update /> },
  { path: '/home', element: (
      <PrivateRoute>
        <ComingSoon/>
      </PrivateRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <PrivateRoute>
        <Profile />
      </PrivateRoute>
    ),
  },
  { path: '/products', element: <ProductPage /> }, 
  { path: '/products/:id', element: <ProductDetails /> }, 
  { path: '/cart', element:<CartPage />},
  { path: '*', element: <Landing /> },
  
];

export default appRoutes;
