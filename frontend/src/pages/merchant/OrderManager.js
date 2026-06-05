import { useState, useEffect } from 'react';
import api from '../../services/api';
import socket from '../../services/socket';
import { playBeep, unlockAudio } from '../../services/notify';
import { useOrderAlert } from '../../hooks/useOrderAlert';
import OrderAlertBanner from '../../components/OrderAlertBanner';
import SoundToggle from '../../components/SoundToggle';

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
};

const PAGE_SIZE = 20;

export default function OrderManager({ restaurantId }) {
  const [activeOrders, setActiveOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [completedTotal, setCompletedTotal] = useState(0);
  const [completedPage, setCompletedPage] = useState(0);
  const [tab, setTab] = useState('active');
  const [loading, setLoading] = useState(true);
  const { alertState, trigger, dismiss } = useOrderAlert();

  const fetchActive = () => {
    api.get('/orders/restaurant?status_group=active')
      .then(res => setActiveOrders(res.data.orders || []))
      .catch(() => setActiveOrders([]))
      .finally(() => setLoading(false));
  };

  const fetchCompleted = (p = completedPage) => {
    api.get(`/orders/restaurant?status_group=completed&limit=${PAGE_SIZE}&offset=${p * PAGE_SIZE}`)
      .then(res => {
        setCompletedOrders(res.data.orders || []);
        setCompletedTotal(res.data.total || 0);
      })
      .catch(() => {});
  };

  const fetchOrders = () => { fetchActive(); fetchCompleted(); };

  useEffect(() => {
    fetchOrders();

    // Her bağlanmada (ilk + yeniden) restoran odasına katıl
    const joinRoom = () => {
      if (restaurantId) socket.emit('join', `restaurant_${restaurantId}`);
    };
    socket.on('connect', joinRoom);
    if (socket.connected) joinRoom();

    socket.on('new_order', () => {
      fetchOrders();
      trigger();
      playBeep();
    });

    // Kurye atandığında veya durum güncellendiğinde yenile
    socket.on('courier_assigned', () => fetchOrders());
    socket.on('order_updated', () => fetchOrders());

    return () => {
      socket.off('new_order');
      socket.off('courier_assigned');
      socket.off('order_updated');
      socket.off('connect', joinRoom);
    };
  }, [restaurantId]);

  const updateStatus = async (orderId, status) => {
    unlockAudio();
    dismiss();
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Güncelleme başarısız');
    }
  };

  const displayed = tab === 'active' ? activeOrders : completedOrders;
  const completedPages = Math.ceil(completedTotal / PAGE_SIZE);

  if (loading) return <div className="text-center py-10 text-gray-500">Yükleniyor...</div>;

  return (
    <div>
      <OrderAlertBanner alertState={alertState} message="Yeni sipariş geldi!" />

      <div className="flex gap-2 mb-4 items-center">
        <button onClick={() => setTab('active')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition ${tab === 'active' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          Aktif {activeOrders.length > 0 && <span className="ml-1 bg-white text-red-600 text-xs px-1.5 py-0.5 rounded-full">{activeOrders.length}</span>}
        </button>
        <button onClick={() => { setTab('completed'); fetchCompleted(completedPage); }}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition ${tab === 'completed' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          Tamamlanan ({completedTotal})
        </button>
        <button onClick={fetchOrders} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 hover:bg-gray-100 rounded-lg transition">
          ↻ Yenile
        </button>
        <div className="ml-auto"><SoundToggle /></div>
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
              <div key={order.id} className={`bg-white rounded-xl shadow p-4 border ${order.status === 'pending' ? 'border-yellow-300' : 'border-gray-100'}`}>
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
                {order.notes && <p className="text-xs text-gray-400 italic mb-1">Not: {order.notes}</p>}
                {order.courier_name && (
                  <p className="text-xs text-indigo-600 mb-1">
                    🛵 Kurye: <span className="font-medium">{order.courier_name}</span>
                    {order.courier_phone && (
                      <a href={`tel:${order.courier_phone}`} className="ml-2 underline hover:text-indigo-800">
                        {order.courier_phone}
                      </a>
                    )}
                  </p>
                )}
                {order.status === 'ready' && !order.courier_name && (
                  <p className="text-xs text-orange-500 mb-1">⏳ Kurye atanıyor...</p>
                )}
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

      {tab === 'completed' && completedPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-6">
          <button onClick={() => { setCompletedPage(p => p - 1); fetchCompleted(completedPage - 1); }} disabled={completedPage === 0}
            className="px-4 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 transition">
            ← Önceki
          </button>
          <span className="text-sm text-gray-500">{completedPage + 1} / {completedPages}</span>
          <button onClick={() => { setCompletedPage(p => p + 1); fetchCompleted(completedPage + 1); }} disabled={completedPage >= completedPages - 1}
            className="px-4 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 transition">
            Sonraki →
          </button>
        </div>
      )}
    </div>
  );
}
