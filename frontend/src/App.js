import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/customer/Home';
import RestaurantDetail from './pages/customer/RestaurantDetail';
import MyOrders from './pages/customer/MyOrders';
import MerchantPanel from './pages/merchant/MerchantPanel';
import CourierPanel from './pages/courier/CourierPanel';
import AdminPanel from './pages/admin/AdminPanel';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="text-center mt-20 text-gray-500">Yükleniyor...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

function AppRoutes() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Home />} />
        <Route path="/restaurant/:id" element={<RestaurantDetail />} />
        <Route path="/orders" element={<PrivateRoute roles={['customer']}><MyOrders /></PrivateRoute>} />
        <Route path="/merchant" element={<PrivateRoute roles={['merchant']}><MerchantPanel /></PrivateRoute>} />
        <Route path="/courier" element={<PrivateRoute roles={['courier']}><CourierPanel /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute roles={['admin']}><AdminPanel /></PrivateRoute>} />
      </Routes>
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
