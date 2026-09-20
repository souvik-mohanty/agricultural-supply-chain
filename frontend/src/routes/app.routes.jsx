import React, { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import { ROLES, BUYER_ROLES, WAREHOUSE_ROLES } from '../auth/roles';

import Landing from '../pages/Landing/Landing';
const Login = lazy(() => import('../pages/Auth/Login/Login'));
const Register = lazy(() => import('../pages/Auth/Register/Register'));
const About = lazy(() => import('../pages/Public/About'));
const Contact = lazy(() => import('../pages/Public/Contact'));
const Categories = lazy(() => import('../pages/Public/Categories'));
const NotFound = lazy(() => import('../pages/Public/NotFound'));
const Unauthorized = lazy(() => import('../pages/Unauthorized/Unauthorized'));

const ProductPage = lazy(() => import('../pages/Product/ProductPages/ProductPage'));
const ProductDetails = lazy(() => import('../pages/Product/ProductDetails/ProductDetails'));
const CartPage = lazy(() => import('../pages/Product/Cart/CartPage'));
const Advisory = lazy(() => import('../pages/Advisory/Advisory'));

const Dashboard = lazy(() => import('../pages/Dashboard/Dashboard'));
const Profile = lazy(() => import('../pages/Profile/Profile'));
const Update = lazy(() => import('../pages/update/update'));
const Notifications = lazy(() => import('../pages/Notifications/Notifications'));
const NewComplaint = lazy(() => import('../pages/Complaints/NewComplaint'));
const Queries = lazy(() => import('../pages/Advisory/Queries'));

const RfqList = lazy(() => import('../pages/Rfq/RfqList'));
const RfqCreate = lazy(() => import('../pages/Rfq/RfqCreate'));
const RfqDetail = lazy(() => import('../pages/Rfq/RfqDetail'));
const MyOrders = lazy(() => import('../pages/Orders/MyOrders'));
const OrderDetails = lazy(() => import('../pages/Orders/OrderDetails'));
const Payments = lazy(() => import('../pages/Orders/Payments'));

const MyProducts = lazy(() => import('../pages/Manage/MyProducts'));
const ProductForm = lazy(() => import('../pages/Manage/ProductForm'));
const Warehouse = lazy(() => import('../pages/Warehouse/Warehouse'));
const AdminUsers = lazy(() => import('../pages/Admin/AdminUsers'));
const AdminComplaints = lazy(() => import('../pages/Admin/AdminComplaints'));
const AdminReports = lazy(() => import('../pages/Admin/AdminReports'));

// Any logged-in user, or only the listed roles. The backend enforces the same rules on every request.
const priv = (element, roles) => <PrivateRoute roles={roles}>{element}</PrivateRoute>;

const BUYERS_AND_ADMIN = [...BUYER_ROLES, ROLES.ADMIN];
const FARMER_OR_ADMIN = [ROLES.FARMER, ROLES.ADMIN];

const appRoutes = [
  // public
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/products', element: <ProductPage /> },
  { path: '/products/:id', element: <ProductDetails /> },
  { path: '/categories', element: <Categories /> },
  { path: '/advisory', element: <Advisory /> },
  { path: '/about', element: <About /> },
  { path: '/contact', element: <Contact /> },
  { path: '/unauthorized', element: <Unauthorized /> },
  { path: '/home', element: <Navigate to="/dashboard" replace /> }, // the old post-login page

  // any logged-in user
  { path: '/dashboard', element: priv(<Dashboard />) },
  { path: '/profile', element: priv(<Profile />) },
  { path: '/update-profile', element: priv(<Update />) },
  { path: '/notifications', element: priv(<Notifications />) },
  { path: '/complaints/new', element: priv(<NewComplaint />) },
  { path: '/cart', element: priv(<CartPage />) },
  { path: '/orders', element: priv(<MyOrders />) },
  { path: '/orders/:id', element: priv(<OrderDetails />) },
  { path: '/payments', element: priv(<Payments />) },
  { path: '/queries', element: priv(<Queries />) },
  { path: '/rfqs', element: priv(<RfqList />) },
  { path: '/rfqs/new', element: priv(<RfqCreate />, BUYERS_AND_ADMIN) },
  { path: '/rfqs/:id', element: priv(<RfqDetail />) },

  // role specific
  { path: '/manage/products', element: priv(<MyProducts />, FARMER_OR_ADMIN) },
  { path: '/manage/products/new', element: priv(<ProductForm />, [ROLES.FARMER]) },
  { path: '/manage/products/:id/edit', element: priv(<ProductForm />, FARMER_OR_ADMIN) },
  { path: '/warehouse', element: priv(<Warehouse />, WAREHOUSE_ROLES) },
  { path: '/admin/users', element: priv(<AdminUsers />, [ROLES.ADMIN]) },
  { path: '/admin/complaints', element: priv(<AdminComplaints />, [ROLES.ADMIN]) },
  { path: '/admin/reports', element: priv(<AdminReports />, [ROLES.ADMIN]) },

  { path: '*', element: <NotFound /> },
];

export default appRoutes;
