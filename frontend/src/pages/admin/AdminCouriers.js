import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminCouriers() {
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCouriers = () => {
    setLoading(true);
    api.get('/admin/couriers')
      .then(res => setCouriers(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCouriers(); }, []);

  const toggleCourier = async (id, name, isActive) => {
    if (!window.confirm(`${name} kuryeyi ${isActive ? 'devre dışı bırakmak' : 'aktif etmek'} istediğinize emin misiniz?`)) return;
    await api.patch(`/admin/users/${id}/toggle`);
    fetchCouriers();
  };

  if (loading) return <div className="text-center py-10 text-gray-500">Yükleniyor...</div>;

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-indigo-50 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Toplam Kurye</p>
          <p className="text-2xl font-bold text-indigo-600">{couriers.length}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Aktif Kurye</p>
          <p className="text-2xl font-bold text-green-600">{couriers.filter(c => c.is_active).length}</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Şu An Teslimat Yapan</p>
          <p className="text-2xl font-bold text-orange-600">{couriers.filter(c => parseInt(c.active_deliveries) > 0).length}</p>
        </div>
      </div>

      {couriers.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <p className="text-3xl mb-2">🛵</p>
          <p>Kayıtlı kurye bulunamadı.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Kurye</th>
                <th className="text-left px-4 py-3">İletişim</th>
                <th className="text-right px-4 py-3">Aktif</th>
                <th className="text-right px-4 py-3">Tamamlanan</th>
                <th className="text-right px-4 py-3">Durum</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {couriers.map(c => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{c.name}</p>
                    <p className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString('tr-TR')} tarihinden beri</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    <p>{c.email}</p>
                    {c.phone && <p>{c.phone}</p>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-bold ${parseInt(c.active_deliveries) > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                      {c.active_deliveries || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-700">
                    {c.completed_deliveries || 0}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => toggleCourier(c.id, c.name, c.is_active)}
                      className={`text-xs px-3 py-1 rounded-lg transition ${
                        c.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}>
                      {c.is_active ? 'Devre Dışı' : 'Aktif Et'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
