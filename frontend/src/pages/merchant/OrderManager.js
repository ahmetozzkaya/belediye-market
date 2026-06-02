import { useState, useEffect } from 'react';
import api from '../../services/api';

const statusLabels = {
  pending: { label: 'Bekliyor', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Onaylandı', color: 'bg-blue-100 text-blue-700' },
  preparing: { label: 'Hazırlanıyor', color: 'bg-orange-100 text-orange-700' },
  ready: { label: 'Hazır', color: 'bg-purple-100 text-purple-700' },
  on_the_way: { label: 'Yolda', color: 'bg-indigo-100 text-indigo-700' },
  delivered: { label: 'Teslim Edildi', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'İptal', color: 'bg-red-100 text-red-700' },
};

const nextStatus = {
  pending: { status: 'confirmed', label: 'Onayla' },
  confirmed: { status: 'preparing', label: 'Hazırlamaya Başla' },
  preparing: { status: 'ready', label: 'Hazır' },
  ready: { status: 'on_the_way', label: 'Yola Çıktı' },
  on_the_way: { status: 'delivered', label: 'Teslim Edildi' },
};

export default function OrderManager() {
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('active');
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    api.get('/orders/restaurant')
      .then(res => setOrders(Array.isArray(res.data) ? res.data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (orderId, status) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Güncelleme başarısız');
    }
  };

  const active = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  const completed = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));
  const displayed = tab === 'active' ? active : completed;

  if (loading) return <div className="text-center py-10 text-gray-500">Yükleniyor...</div>;

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('active')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition ${tab === 'active' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          Aktif ({active.length})
        </button>
        <button onClick={() => setTab('completed')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition ${tab === 'completed' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          Tamamlanan ({completed.length})
        </button>
        <button onClick={fetchOrders} className="ml-auto text-sm text-gray-500 hover:text-gray-700 px-3 py-2 hover:bg-gray-100 rounded-lg transition">
          ↻ Yenile
        </button>
      </div>

      {displayed.length === 0 ? (
        <div className="text-center text-gray-400 py-10">
          <p className="text-3xl mb-2">📋</p>
          <p>{tab === 'active' ? 'Aktif sipariş yok.' : 'Tamamlanan sipariş yok.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(order => {
            const s = statusLabels[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-700' };
            const next = nextStatus[order.status];
            return (
              <div key={order.id} className="bg-white rounded-xl shadow p-4 border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-gray-800">#{order.id} — {order.customer_name}</p>
                    <p className="text-xs text-gray-400">{order.customer_phone} · {new Date(order.created_at).toLocaleString('tr-TR')}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.color}`}>{s.label}</span>
                </div>
                <div className="text-sm text-gray-600 space-y-0.5 mb-2">
                  {order.items?.map((item, i) => (
                    <p key={i}>{item.name} x{item.quantity} — {(item.unit_price * item.quantity).toFixed(2)} ₺</p>
                  ))}
                </div>
                {order.notes && <p className="text-xs text-gray-400 italic mb-2">Not: {order.notes}</p>}
                <div className="flex justify-between items-center pt-2 border-t">
                  <p className="text-xs text-gray-400">📍 {order.delivery_address}</p>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-red-600">{parseFloat(order.total_amount).toFixed(2)} ₺</p>
                    {next && (
                      <button onClick={() => updateStatus(order.id, next.status)}
                        className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition font-medium">
                        {next.label}
                      </button>
                    )}
                    {order.status === 'pending' && (
                      <button onClick={() => updateStatus(order.id, 'cancelled')}
                        className="text-xs text-red-400 hover:text-red-600 px-2">
                        İptal
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
