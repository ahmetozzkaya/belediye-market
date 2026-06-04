import { useState, useEffect } from 'react';
import api from '../../services/api';

const STATUS_TABS = [
  { value: 'pending',  label: 'Onay Bekleyen', color: 'text-yellow-700 bg-yellow-100' },
  { value: 'approved', label: 'Aktif',         color: 'text-green-700 bg-green-100' },
  { value: 'rejected', label: 'Reddedilen',    color: 'text-red-700 bg-red-100' },
  { value: 'all',      label: 'Tümü',          color: 'text-gray-700 bg-gray-100' },
];

export default function AdminRestaurants({ onPendingChange }) {
  const [restaurants, setRestaurants] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);

  const fetchRestaurants = (status = filter) => {
    setLoading(true);
    api.get(`/admin/restaurants?status=${status}`)
      .then(res => {
        setRestaurants(res.data);
        const pending = res.data.filter(r => r.approval_status === 'pending').length;
        if (status === 'all') onPendingChange(pending);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRestaurants(filter); }, [filter]);

  const approve = async (id) => {
    await api.patch(`/admin/restaurants/${id}/approve`);
    fetchRestaurants('pending');
    onPendingChange(prev => Math.max(0, prev - 1));
  };

  const reject = async (id) => {
    if (!window.confirm('Bu başvuruyu reddetmek istediğinize emin misiniz?')) return;
    await api.patch(`/admin/restaurants/${id}/reject`);
    fetchRestaurants('pending');
    onPendingChange(prev => Math.max(0, prev - 1));
  };

  const toggleActive = async (id, name, isActive) => {
    if (!window.confirm(`${name} işletmesini ${isActive ? 'devre dışı bırakmak' : 'aktif etmek'} istediğinize emin misiniz?`)) return;
    await api.patch(`/admin/restaurants/${id}/toggle`);
    fetchRestaurants(filter);
  };

  const fmt = (n) => parseFloat(n || 0).toFixed(2);

  return (
    <div>
      <div className="flex gap-2 mb-5 flex-wrap">
        {STATUS_TABS.map(s => (
          <button key={s.value} onClick={() => setFilter(s.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === s.value ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}>
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Yükleniyor...</div>
      ) : restaurants.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <p className="text-3xl mb-2">🏪</p>
          <p>Bu kategoride işletme bulunamadı.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {restaurants.map(r => (
            <div key={r.id} className="bg-white rounded-xl shadow p-4 border border-gray-100">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-gray-800">{r.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      r.approval_status === 'approved' ? 'bg-green-100 text-green-700' :
                      r.approval_status === 'pending'  ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {r.approval_status === 'approved' ? 'Onaylı' : r.approval_status === 'pending' ? 'Beklemede' : 'Reddedildi'}
                    </span>
                    {r.approval_status === 'approved' && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${r.is_active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                        {r.is_active ? 'Yayında' : 'Yayında Değil'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">👤 {r.owner_name} — {r.owner_email} {r.owner_phone && `· ${r.owner_phone}`}</p>
                  <p className="text-sm text-gray-400">📍 {r.address}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Tamamlanan sipariş: <span className="font-medium text-gray-600">{r.total_orders}</span>
                    {' · '}Komisyon: <span className="font-medium text-gray-600">%{parseFloat(r.commission_rate).toFixed(0)}</span>
                    {' · '}Kayıt: {new Date(r.created_at).toLocaleDateString('tr-TR')}
                  </p>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  {r.approval_status === 'pending' && (
                    <>
                      <button onClick={() => approve(r.id)}
                        className="text-xs bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 transition font-medium">
                        ✓ Onayla
                      </button>
                      <button onClick={() => reject(r.id)}
                        className="text-xs bg-red-50 text-red-600 border border-red-200 px-4 py-1.5 rounded-lg hover:bg-red-100 transition">
                        ✕ Reddet
                      </button>
                    </>
                  )}
                  {r.approval_status === 'approved' && (
                    <button onClick={() => toggleActive(r.id, r.name, r.is_active)}
                      className={`text-xs px-4 py-1.5 rounded-lg transition ${
                        r.is_active
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          : 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100'
                      }`}>
                      {r.is_active ? 'Yayından Kaldır' : 'Yayına Al'}
                    </button>
                  )}
                  {r.approval_status === 'rejected' && (
                    <button onClick={() => approve(r.id)}
                      className="text-xs bg-green-50 text-green-600 border border-green-200 px-4 py-1.5 rounded-lg hover:bg-green-100 transition">
                      Yeniden Onayla
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
