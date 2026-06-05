import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_OPTIONS = [
  { value: 'customer', label: 'Müşteri', desc: 'Sipariş vermek istiyorum', icon: '🛍️' },
  { value: 'merchant', label: 'Esnaf / İşletme', desc: 'İşletmemi platforma eklemek istiyorum', icon: '🏪' },
  { value: 'courier', label: 'Kurye', desc: 'Teslimat yapmak istiyorum', icon: '🛵' },
];

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '', role: 'customer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      await login(form.email, form.password);
      const routes = { customer: '/', merchant: '/merchant', courier: '/courier' };
      navigate(routes[form.role] || '/');
    } catch (err) {
      setError(err.message || 'Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Sol panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-red-600 to-red-700 flex-col justify-between p-12 text-white">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <span className="text-red-600 text-xl">🛒</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">Belediye Market</span>
          </div>
          <h1 className="text-3xl font-bold leading-snug mb-4">
            Topluluğun bir parçası olun
          </h1>
          <p className="text-red-100 leading-relaxed max-w-sm">
            Müşteri, esnaf veya kurye olarak platforma katılın. Yerel ekonomiyi birlikte güçlendirelim.
          </p>
        </div>
        <div className="bg-white/10 rounded-2xl p-6">
          <p className="text-sm text-red-100 mb-1">Platform komisyonu</p>
          <p className="text-3xl font-bold">%8–10</p>
          <p className="text-red-200 text-sm mt-1">Büyük platformlardan çok daha az</p>
        </div>
      </div>

      {/* Sağ panel — form */}
      <div className="flex-1 flex items-start justify-center bg-gray-50 px-6 py-10 overflow-y-auto">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 justify-center mb-6 lg:hidden">
            <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">🛒</span>
            </div>
            <span className="text-xl font-bold text-gray-800">Belediye Market</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Hesap oluşturun</h2>
          <p className="text-gray-500 text-sm mb-6">Birkaç adımda platforma katılın</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5 flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Hesap türü seçimi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hesap Türü</label>
              <div className="space-y-2">
                {ROLE_OPTIONS.map(opt => (
                  <label key={opt.value}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      form.role === opt.value
                        ? 'border-red-400 bg-red-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}>
                    <input type="radio" name="role" value={opt.value}
                      checked={form.role === opt.value}
                      onChange={e => setForm({...form, role: e.target.value})}
                      className="accent-red-600" />
                    <span className="text-xl">{opt.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                      <p className="text-xs text-gray-400">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ad Soyad *</label>
              <input type="text" required value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                placeholder="Adınız Soyadınız"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition placeholder:text-gray-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
              <input type="email" required value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                placeholder="ornek@email.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition placeholder:text-gray-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Şifre *</label>
              <input type="password" required value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                placeholder="En az 6 karakter"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition placeholder:text-gray-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefon</label>
              <input type="tel" value={form.phone}
                onChange={e => setForm({...form, phone: e.target.value})}
                placeholder="0555 123 45 67"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition placeholder:text-gray-400" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition shadow-sm shadow-red-200">
              {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Zaten hesabın var mı?{' '}
            <Link to="/login" className="text-red-600 font-medium hover:text-red-700">Giriş Yap</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
