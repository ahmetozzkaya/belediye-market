import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const statusLabels = {
  pending:    { label: 'Bekliyor',      color: 'bg-yellow-100 text-yellow-700' },
  confirmed:  { label: 'Onaylandı',    color: 'bg-blue-100 text-blue-700' },
  preparing:  { label: 'Hazırlanıyor', color: 'bg-orange-100 text-orange-700' },
  ready:      { label: 'Hazır',        color: 'bg-orange-100 text-orange-700' },
  on_the_way: { label: 'Yolda',        color: 'bg-indigo-100 text-indigo-700' },
  delivered:  { label: 'Teslim Edildi',color: 'bg-green-100 text-green-700' },
  cancelled:  { label: 'İptal',        color: 'bg-red-100 text-red-700' },
};

const STATUS_TABS = [
  { value: '', label: 'Tümü' },
  { value: 'pending', label: 'Bekliyor' },
  { value: 'preparing', label: 'Hazırlanıyor' },
  { value: 'on_the_way', label: 'Yolda' },
  { value: 'delivered', label: 'Teslim Edildi' },
  { value: 'cancelled', label: 'İptal' },
];

const DATE_PRESETS = [
  { label: 'Bugün', getValue: () => { const d = today(); return { from: d, to: d }; } },
  { label: 'Bu Hafta', getValue: () => ({ from: startOf('week'), to: today() }) },
  { label: 'Bu Ay', getValue: () => ({ from: startOf('month'), to: today() }) },
  { label: 'Tümü', getValue: () => ({ from: '', to: '' }) },
];

function today() {
  return new Date().toISOString().split('T')[0];
}
function startOf(unit) {
  const d = new Date();
  if (unit === 'week') { d.setDate(d.getDate() - d.getDay() + 1); }
  if (unit === 'month') { d.setDate(1); }
  return d.toISOString().split('T')[0];
}

const PAGE_SIZE = 20;

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState('');
  const [restaurantId, setRestaurantId] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [activeDatePreset, setActiveDatePreset] = useState('Tümü');
  const [page, setPage] = useState(0);

  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    api.get('/admin/restaurants?status=approved')
      .then(res => setRestaurants(res.data))
      .catch(() => {});
  }, []);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (restaurantId) params.set('restaurant_id', restaurantId);
    if (dateRange.from) params.set('from', dateRange.from);
    if (dateRange.to) params.set('to', dateRange.to);
    params.set('limit', PAGE_SIZE);
    params.set('offset', page * PAGE_SIZE);

    api.get(`/admin/orders?${params.toString()}`)
      .then(res => {
        setOrders(res.data.orders);
        setTotal(res.data.total);
        setRevenue(res.data.revenue);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, restaurantId, dateRange, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleDatePreset = (preset) => {
    setActiveDatePreset(preset.label);
    setDateRange(preset.getValue());
    setPage(0);
  };

  const handleStatusChange = (val) => { setStatus(val); setPage(0); };
  const handleRestaurantChange = (val) => { setRestaurantId(val); setPage(0); };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      {/* Tarih Filtreleri */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {DATE_PRESETS.map(p => (
          <button key={p.label} onClick={() => handleDatePreset(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeDatePreset === p.label ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}>
            {p.label}
          </button>
        ))}
        <div className="flex items-center gap-2 ml-2">
          <input type="date" value={dateRange.from}
            onChange={e => { setDateRange(d => ({...d, from: e.target.value})); setActiveDatePreset(''); setPage(0); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
          <span className="text-gray-400 text-sm">—</span>
          <input type="date" value={dateRange.to}
            onChange={e => { setDateRange(d => ({...d, to: e.target.value})); setActiveDatePreset(''); setPage(0); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
        </div>
      </div>

      {/* Durum Tabları */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUS_TABS.map(s => (
          <button key={s.value} onClick={() => handleStatusChange(s.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              status === s.value ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* İşletme Filtresi */}
      <div className="mb-4">
        <select value={restaurantId} onChange={e => handleRestaurantChange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-red-400">
          <option value="">Tüm İşletmeler</option>
          {restaurants.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      {/* Özet Bar */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-3 mb-5 flex gap-6 text-sm">
        <span className="text-gray-500">Toplam Sipariş: <span className="font-semibold text-gray-800">{total}</span></span>
        <span className="text-gray-500">Toplam Tutar: <span className="font-semibold text-red-600">{revenue.toFixed(2)} ₺</span></span>
        {totalPages > 1 && (
          <span className="text-gray-400 ml-auto">Sayfa {page + 1} / {totalPages}</span>
        )}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="text-center py-10 text-gray-500">Yükleniyor...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <p className="text-3xl mb-2">📦</p>
          <p>Seçili filtrelere uygun sipariş bulunamadı.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const s = statusLabels[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-700' };
            return (
              <div key={order.id} className="bg-white rounded-xl shadow p-4 border border-gray-100">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <p className="font-semibold text-gray-800">{order.restaurant_name}</p>
                    <p className="text-xs text-gray-400">
                      #{order.id} · {new Date(order.created_at).toLocaleString('tr-TR')}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${s.color}`}>{s.label}</span>
                </div>
                <div className="text-sm text-gray-600 space-y-0.5 mb-2">
                  {order.items?.map((item, i) => (
                    <p key={i}>{item.name} x{item.quantity} — {(item.unit_price * item.quantity).toFixed(2)} ₺</p>
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 pt-2 border-t">
                  <span>👤 {order.customer_name}{order.customer_phone ? ` · ${order.customer_phone}` : ''}</span>
                  {order.courier_name && <span>🛵 {order.courier_name}</span>}
                  <span className="ml-auto font-semibold text-red-600 text-sm">{parseFloat(order.total_amount).toFixed(2)} ₺</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sayfalama */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-6">
          <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
            className="px-4 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 transition">
            ← Önceki
          </button>
          <span className="text-sm text-gray-500">{page + 1} / {totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}
            className="px-4 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 transition">
            Sonraki →
          </button>
        </div>
      )}
    </div>
  );
}
