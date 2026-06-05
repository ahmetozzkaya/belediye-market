import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Bir hata oluştu, tekrar deneyin.');
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

        {sent ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="text-5xl mb-4">📬</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">İstek alındı</h2>
            <p className="text-sm text-gray-500 mb-4">
              Eğer bu e-posta sistemimizde kayıtlıysa, şifre sıfırlama bağlantısı gönderildi.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-xs text-yellow-800 text-left mb-6">
              <strong>Geliştirme ortamı:</strong> Sıfırlama bağlantısı e-posta yerine sunucu konsoluna yazıldı.
            </div>
            <Link to="/login" className="text-red-600 font-medium text-sm hover:text-red-700">
              ← Giriş sayfasına dön
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Şifremi unuttum</h2>
            <p className="text-sm text-gray-500 mb-6">
              Kayıtlı e-posta adresinizi girin, sıfırlama bağlantısı gönderelim.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5 flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">E-posta</label>
                <input
                  type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition placeholder:text-gray-400"
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition">
                {loading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              <Link to="/login" className="text-red-600 font-medium hover:text-red-700">← Giriş sayfasına dön</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
