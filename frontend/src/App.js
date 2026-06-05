import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import CustomerNav from './components/CustomerNav';
import CourierNav from './components/CourierNav';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';
import Home from './pages/customer/Home';
import RestaurantDetail from './pages/customer/RestaurantDetail';
import MyOrders from './pages/customer/MyOrders';
import OrderDetail from './pages/customer/OrderDetail';
import Profile from './pages/customer/Profile';
import MerchantPanel from './pages/merchant/MerchantPanel';
import CourierPanel from './pages/courier/CourierPanel';
import CourierProfile from './pages/courier/CourierProfile';
import AdminPanel from './pages/admin/AdminPanel';

const roleHome = { customer: '/', merchant: '/merchant', courier: '/courier', admin: '/admin' };

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="text-center mt-20 text-gray-500">Yükleniyor...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to={roleHome[user.role] || '/'} />;
  return children;
};

const HomeRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="text-center mt-20 text-gray-500">Yükleniyor...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'customer') return <Navigate to={roleHome[user.role]} />;
  return <Home />;
};

const CUSTOMER_PATHS = ['/', '/orders', '/profile'];
// order detail path'i dinamik, startsWith ile kontrol ediliyor
const COURIER_PATHS = ['/courier', '/courier/profile'];

function AppRoutes() {
  const { user } = useAuth();
  const location = useLocation();

  const isCustomerPage = user?.role === 'customer' &&
    (CUSTOMER_PATHS.includes(location.pathname) ||
     location.pathname.startsWith('/restaurant') ||
     location.pathname.startsWith('/orders/'));
  const isCourierPage = user?.role === 'courier' &&
    COURIER_PATHS.includes(location.pathname);

  const showBottomNav = isCustomerPage || isCourierPage;

  return (
    <div className="min-h-screen bg-gray-50">
      {!showBottomNav && <Navbar />}
      <div className={showBottomNav ? 'pb-16' : ''}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/" element={<HomeRoute />} />
          <Route path="/restaurant/:id" element={<PrivateRoute roles={['customer']}><RestaurantDetail /></PrivateRoute>} />
          <Route path="/orders" element={<PrivateRoute roles={['customer']}><MyOrders /></PrivateRoute>} />
          <Route path="/orders/:id" element={<PrivateRoute roles={['customer']}><OrderDetail /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute roles={['customer']}><Profile /></PrivateRoute>} />
          <Route path="/merchant" element={<PrivateRoute roles={['merchant']}><MerchantPanel /></PrivateRoute>} />
          <Route path="/courier" element={<PrivateRoute roles={['courier']}><CourierPanel /></PrivateRoute>} />
          <Route path="/courier/profile" element={<PrivateRoute roles={['courier']}><CourierProfile /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute roles={['admin']}><AdminPanel /></PrivateRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      {isCustomerPage && <CustomerNav />}
      {isCourierPage && <CourierNav />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
