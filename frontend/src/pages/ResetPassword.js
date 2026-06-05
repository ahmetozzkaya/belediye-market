import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center max-w-sm w-full">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Geçersiz bağlantı</h2>
          <p className="text-sm text-gray-500 mb-6">Bu şifre sıfırlama bağlantısı geçersiz veya eksik.</p>
          <Link to="/forgot-password" className="text-red-600 font-medium text-sm hover:text-red-700">
            Yeni bağlantı talep et
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      return setError('Şifreler eşleşmiyor.');
    }
    if (form.password.length < 6) {
      return setError('Şifre en az 6 karakter olmalıdır.');
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password: form.password });
      navigate('/login', { state: { message: 'Şifreniz güncellendi, giriş yapabilirsiniz.' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-lg">🛒</span>
          </div>
          <span className="text-xl font-bold text-gray-800">Belediye Market</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Yeni şifre belirle</h2>
          <p className="text-sm text-gray-500 mb-6">En az 6 karakter olmalıdır.</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5 flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Yeni Şifre</label>
              <input
                type="password" required value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Şifre Tekrar</label>
              <input
                type="password" required value={form.confirm}
                onChange={e => setForm({ ...form, confirm: e.target.value })}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition placeholder:text-gray-400"
              />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition">
              {loading ? 'Kaydediliyor...' : 'Şifremi Güncelle'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
