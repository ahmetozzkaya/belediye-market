import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function CourierProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.put('/auth/profile', form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Güncelleme başarısız');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.new_password !== pwForm.confirm) return setPwError('Yeni şifreler eşleşmiyor');
    try {
      await api.put('/auth/change-password', {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      setPwSuccess(true);
      setPwForm({ current_password: '', new_password: '', confirm: '' });
      setTimeout(() => setPwSuccess(false), 2000);
    } catch (err) {
      setPwError(err.response?.data?.message || 'Şifre değiştirilemedi');
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8 pb-24">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Profilim</h1>

      <div className="bg-white rounded-xl shadow p-5 mb-4">
        <div className="flex items-center gap-4 mb-5 pb-4 border-b">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-2xl font-bold text-red-600">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full mt-1 inline-block">Kurye</span>
          </div>
        </div>

        {error && <p className="bg-red-50 text-red-600 text-sm p-3 rounded mb-4">{error}</p>}
        {success && <p className="bg-green-50 text-green-600 text-sm p-3 rounded mb-4">✓ Bilgiler güncellendi</p>}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
              placeholder="0555 123 45 67"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
            <input value={user?.email} disabled
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
          </div>
          <button type="submit"
            className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition font-medium text-sm">
            Kaydet
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow p-5 mb-4">
        <h2 className="font-semibold text-gray-800 mb-4">Şifre Değiştir</h2>
        {pwError && <p className="bg-red-50 text-red-600 text-sm p-3 rounded mb-4">{pwError}</p>}
        {pwSuccess && <p className="bg-green-50 text-green-600 text-sm p-3 rounded mb-4">✓ Şifre güncellendi</p>}
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mevcut Şifre</label>
            <input type="password" value={pwForm.current_password}
              onChange={e => setPwForm({...pwForm, current_password: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Yeni Şifre</label>
            <input type="password" value={pwForm.new_password}
              onChange={e => setPwForm({...pwForm, new_password: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Yeni Şifre (Tekrar)</label>
            <input type="password" value={pwForm.confirm}
              onChange={e => setPwForm({...pwForm, confirm: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
          </div>
          <button type="submit"
            className="w-full bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-900 transition font-medium text-sm">
            Şifreyi Güncelle
          </button>
        </form>
      </div>

      <button onClick={() => { logout(); navigate('/login'); }}
        className="w-full bg-white border border-red-200 text-red-600 py-3 rounded-xl hover:bg-red-50 transition font-medium text-sm shadow">
        Çıkış Yap
      </button>
    </div>
  );
}
