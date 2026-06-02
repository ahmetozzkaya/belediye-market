import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleLabels = {
  customer: 'Müşteri',
  merchant: 'Esnaf',
  courier: 'Kurye',
  admin: 'Yönetici',
};

const roleHome = {
  customer: '/',
  merchant: '/merchant',
  courier: '/courier',
  admin: '/admin',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-red-600 text-white px-6 py-3 flex items-center justify-between shadow-md">
      <Link to={user ? roleHome[user.role] : '/'} className="text-xl font-bold tracking-wide">
        Belediye Market
      </Link>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-sm opacity-80">
              {user.name} <span className="bg-white text-red-600 text-xs px-2 py-0.5 rounded-full ml-1">{roleLabels[user.role]}</span>
            </span>
            <button onClick={handleLogout} className="text-sm bg-white text-red-600 px-3 py-1 rounded hover:bg-red-50 transition">
              Çıkış
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm hover:underline">Giriş</Link>
            <Link to="/register" className="text-sm bg-white text-red-600 px-3 py-1 rounded hover:bg-red-50 transition">Kayıt Ol</Link>
          </>
        )}
      </div>
    </nav>
  );
}
