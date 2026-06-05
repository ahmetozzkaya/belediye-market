import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleHome = { customer: '/', merchant: '/merchant', courier: '/courier', admin: '/admin' };

export default function NotFound() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleBack = () => navigate(user ? (roleHome[user.role] || '/') : '/login');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-sm">
        <div className="text-8xl mb-4">🍽️</div>
        <h1 className="text-6xl font-bold text-red-600 mb-2">404</h1>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Sayfa bulunamadı</h2>
        <p className="text-sm text-gray-500 mb-8">
          Aradığınız sayfa taşınmış veya mevcut değil.
        </p>
        <button onClick={handleBack}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold text-sm transition">
          Ana Sayfaya Dön
        </button>
      </div>
    </div>
  );
}
