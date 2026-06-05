import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      const routes = { customer: '/', merchant: '/merchant', courier: '/courier', admin: '/admin' };
      navigate(routes[user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Email veya şifre hatalı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Sol panel — marka */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-red-600 to-red-700 flex-col justify-between p-12 text-white">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <span className="text-red-600 text-xl">🛒</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">Belediye Market</span>
          </div>
          <h1 className="text-4xl font-bold leading-snug mb-4">
            Belediyenizin<br />dijital çarşısı
          </h1>
          <p className="text-red-100 text-lg leading-relaxed max-w-sm">
            Yerel esnafı destekleyin, hızlı teslimat alın. Belediye güvencesiyle sipariş verin.
          </p>
        </div>
        <div className="space-y-4">
          {[
            { icon: '🏪', text: 'Yüzlerce yerel işletme' },
            { icon: '🛵', text: 'Belediye kuryesiyle güvenli teslimat' },
            { icon: '💰', text: 'Esnafa daha fazla kazanç' },
          ].map(item => (
            <div key={item.text} className="flex items-center gap-3">
              <span className="text-2xl">{item.icon}</span>
              <span className="text-red-100">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sağ panel — form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobilde logo */}
          <div className="flex items-center gap-2 justify-center mb-8 lg:hidden">
            <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">🛒</span>
            </div>
            <span className="text-xl font-bold text-gray-800">Belediye Market</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Tekrar hoş geldiniz</h2>
          <p className="text-gray-500 text-sm mb-8">Hesabınıza giriş yapın</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" required value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                placeholder="ornek@email.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition placeholder:text-gray-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Şifre</label>
              <input type="password" required value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition placeholder:text-gray-400" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition shadow-sm shadow-red-200">
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Hesabın yok mu?{' '}
            <Link to="/register" className="text-red-600 font-medium hover:text-red-700">Kayıt Ol</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
