import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleLabels = { customer: 'Müşteri', merchant: 'Esnaf', courier: 'Kurye', admin: 'Yönetici' };
const roleColors = {
  customer: 'bg-orange-100 text-orange-700',
  merchant: 'bg-blue-100 text-blue-700',
  courier: 'bg-indigo-100 text-indigo-700',
  admin:    'bg-red-100 text-red-700',
};
const roleHome = { customer: '/', merchant: '/merchant', courier: '/courier', admin: '/admin' };

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between shadow-sm">
      <Link to={user ? roleHome[user.role] : '/'} className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shadow-sm">
          <span className="text-white text-base">🛒</span>
        </div>
        <span className="text-lg font-bold text-gray-900 tracking-tight">
          Belediye <span className="text-red-600">Market</span>
        </span>
      </Link>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 hidden sm:block">{user.name}</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleColors[user.role]}`}>
                {roleLabels[user.role]}
              </span>
            </div>
            <button onClick={() => { logout(); navigate('/login'); }}
              className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
              Çıkış
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm text-gray-600 hover:text-gray-800 transition">Giriş Yap</Link>
            <Link to="/register" className="text-sm bg-red-600 text-white px-4 py-1.5 rounded-lg hover:bg-red-700 transition font-medium">
              Kayıt Ol
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
