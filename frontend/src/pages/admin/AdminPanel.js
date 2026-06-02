import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [municipality, setMunicipality] = useState(null);
  const [tab, setTab] = useState('stats');
  const [muniForm, setMuniForm] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/admin/stats').then(res => setStats(res.data));
    api.get('/admin/users').then(res => setUsers(res.data));
    api.get('/admin/municipality').then(res => { setMunicipality(res.data); setMuniForm(res.data); });
  }, []);

  const toggleUser = async (id) => {
    const res = await api.patch(`/admin/users/${id}/toggle`);
    setUsers(prev => prev.map(u => u.id === id ? {...u, is_active: res.data.is_active} : u));
  };

  const saveMunicipality = async () => {
    const res = await api.put('/admin/municipality', muniForm);
    setMunicipality(res.data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const roleColors = { customer: 'bg-blue-100 text-blue-700', merchant: 'bg-orange-100 text-orange-700', courier: 'bg-purple-100 text-purple-700', admin: 'bg-red-100 text-red-700' };
  const roleLabels = { customer: 'Müşteri', merchant: 'Esnaf', courier: 'Kurye', admin: 'Admin' };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Yönetim Paneli</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['stats', 'users', 'settings'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${tab === t ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {t === 'stats' ? 'İstatistikler' : t === 'users' ? 'Kullanıcılar' : 'Belediye Ayarları'}
          </button>
        ))}
      </div>

      {tab === 'stats' && stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Toplam Kullanıcı', value: stats.total_users, color: 'text-blue-600' },
            { label: 'Toplam İşletme', value: stats.total_restaurants, color: 'text-orange-600' },
            { label: 'Tamamlanan Sipariş', value: stats.total_orders, color: 'text-green-600' },
            { label: 'Toplam Ciro', value: `${parseFloat(stats.total_revenue || 0).toFixed(2)} ₺`, color: 'text-red-600' },
            { label: 'Komisyon Geliri', value: `${parseFloat(stats.total_commission || 0).toFixed(2)} ₺`, color: 'text-purple-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl shadow p-5 text-center">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">Ad</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Rol</th>
                <th className="text-left px-4 py-3">Durum</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${roleColors[u.role]}`}>{roleLabels[u.role]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {u.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => toggleUser(u.id)}
                      className={`text-xs px-3 py-1 rounded ${u.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                      {u.is_active ? 'Devre Dışı' : 'Aktif Et'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'settings' && muniForm.name && (
        <div className="bg-white rounded-xl shadow p-6 max-w-md">
          <h3 className="font-semibold text-gray-800 mb-4">Belediye Bilgileri</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Belediye Adı</label>
              <input value={muniForm.name} onChange={e => setMuniForm({...muniForm, name: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
              <input value={muniForm.logo_url || ''} onChange={e => setMuniForm({...muniForm, logo_url: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400 text-sm" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ana Renk</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={muniForm.primary_color} onChange={e => setMuniForm({...muniForm, primary_color: e.target.value})}
                    className="h-9 w-16 rounded border cursor-pointer" />
                  <span className="text-sm text-gray-500">{muniForm.primary_color}</span>
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">İkincil Renk</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={muniForm.secondary_color} onChange={e => setMuniForm({...muniForm, secondary_color: e.target.value})}
                    className="h-9 w-16 rounded border cursor-pointer" />
                  <span className="text-sm text-gray-500">{muniForm.secondary_color}</span>
                </div>
              </div>
            </div>
            <button onClick={saveMunicipality}
              className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition font-medium text-sm">
              {saved ? '✓ Kaydedildi' : 'Kaydet'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
