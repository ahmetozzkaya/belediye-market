import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import CustomerNav from './components/CustomerNav';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/customer/Home';
import RestaurantDetail from './pages/customer/RestaurantDetail';
import MyOrders from './pages/customer/MyOrders';
import Profile from './pages/customer/Profile';
import MerchantPanel from './pages/merchant/MerchantPanel';
import CourierPanel from './pages/courier/CourierPanel';
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

function AppRoutes() {
  const { user } = useAuth();
  const location = useLocation();
  const isCustomerPage = user?.role === 'customer' &&
    (CUSTOMER_PATHS.includes(location.pathname) || location.pathname.startsWith('/restaurant'));
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50">
      {!isCustomerPage && <Navbar />}
      <div className={isCustomerPage ? 'pb-16' : ''}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<HomeRoute />} />
          <Route path="/restaurant/:id" element={<PrivateRoute roles={['customer']}><RestaurantDetail /></PrivateRoute>} />
          <Route path="/orders" element={<PrivateRoute roles={['customer']}><MyOrders /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute roles={['customer']}><Profile /></PrivateRoute>} />
          <Route path="/merchant" element={<PrivateRoute roles={['merchant']}><MerchantPanel /></PrivateRoute>} />
          <Route path="/courier" element={<PrivateRoute roles={['courier']}><CourierPanel /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute roles={['admin']}><AdminPanel /></PrivateRoute>} />
        </Routes>
      </div>
      {isCustomerPage && <CustomerNav />}
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
