import { useState, useEffect } from 'react';
import api from '../../services/api';
import socket from '../../services/socket';
import { playBeep, unlockAudio } from '../../services/notify';
import { useOrderAlert } from '../../hooks/useOrderAlert';
import OrderAlertBanner from '../../components/OrderAlertBanner';
import SoundToggle from '../../components/SoundToggle';

const PAGE_SIZE = 20;

export default function CourierPanel() {
  const [activeOrders, setActiveOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [completedTotal, setCompletedTotal] = useState(0);
  const [completedPage, setCompletedPage] = useState(0);
  const [tab, setTab] = useState('active');
  const [loading, setLoading] = useState(true);
  const { alertState, trigger, dismiss } = useOrderAlert();

  const fetchActive = () => {
    api.get('/orders/courier?status_group=active')
      .then(res => setActiveOrders(res.data.orders || []))
      .catch(() => setActiveOrders([]))
      .finally(() => setLoading(false));
  };

  const fetchCompleted = (p = completedPage) => {
    api.get(`/orders/courier?status_group=completed&limit=${PAGE_SIZE}&offset=${p * PAGE_SIZE}`)
      .then(res => {
        setCompletedOrders(res.data.orders || []);
        setCompletedTotal(res.data.total || 0);
      })
      .catch(() => {});
  };

  const fetchOrders = () => { fetchActive(); if (tab === 'completed') fetchCompleted(); };

  useEffect(() => {
    fetchActive();
    fetchCompleted(0);

    socket.on('order_assigned', () => { fetchActive(); trigger(); playBeep(); });
    socket.on('order_ready', () => { fetchActive(); });

    return () => {
      socket.off('order_assigned');
      socket.off('order_ready');
    };
  }, []);

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

  if (loading) return <div className="text-center mt-20 text-gray-500">Yükleniyor...</div>;

  const completedPages = Math.ceil(completedTotal / PAGE_SIZE);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Teslimatlar</h1>
        <SoundToggle />
      </div>

      <OrderAlertBanner alertState={alertState} message="Size yeni bir teslimat atandı!" />

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-3xl font-bold text-red-600">{activeOrders.length}</p>
          <p className="text-sm text-gray-500">Aktif Teslimat</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{completedTotal}</p>
          <p className="text-sm text-gray-500">Tamamlanan</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('active')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'active' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          Aktif {activeOrders.length > 0 && <span className="ml-1 bg-white text-red-600 text-xs px-1.5 py-0.5 rounded-full">{activeOrders.length}</span>}
        </button>
        <button onClick={() => { setTab('completed'); fetchCompleted(completedPage); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'completed' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          Tamamlanan ({completedTotal})
        </button>
      </div>

      {tab === 'active' && activeOrders.length === 0 ? (
        <div className="text-center text-gray-500 mt-10">
          <p className="text-4xl mb-3">🚴</p>
          <p>Aktif sipariş bulunmuyor.</p>
        </div>
      ) : tab === 'completed' && completedOrders.length === 0 ? (
        <div className="text-center text-gray-400 mt-10">
          <p className="text-3xl mb-2">📦</p>
          <p>Tamamlanan teslimat yok.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(tab === 'active' ? activeOrders : completedOrders).map(order => (
            <div key={order.id} className="bg-white rounded-xl shadow p-4 border border-gray-100">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-gray-800">Sipariş #{order.id}</p>
                  <p className="text-sm text-gray-500">{order.restaurant_name}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                  {order.status === 'delivered' ? 'Teslim Edildi' : 'Aktif'}
                </span>
              </div>
              <div className="text-sm space-y-1 text-gray-600">
                <p>
                  🏪 <span className="font-medium">Restoran:</span> {order.restaurant_name}
                  {order.restaurant_phone && (
                    <a href={`tel:${order.restaurant_phone}`} className="ml-2 text-indigo-600 underline hover:text-indigo-800">
                      {order.restaurant_phone}
                    </a>
                  )}
                </p>
                <p>📍 <span className="font-medium">Restoran Adresi:</span> {order.restaurant_address}</p>
                <p>👤 <span className="font-medium">Müşteri:</span> {order.customer_name} — {order.customer_phone}</p>
                <p>📍 <span className="font-medium">Teslimat:</span> {order.delivery_address}</p>
              </div>
              <div className="mt-3 flex justify-between items-center">
                <p className="font-semibold text-red-600">{parseFloat(order.total_amount).toFixed(2)} ₺</p>
                {order.status === 'ready' && (
                  <button onClick={() => updateStatus(order.id, 'on_the_way')}
                    className="text-sm bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition">
                    Teslimata Başla
                  </button>
                )}
                {order.status === 'on_the_way' && (
                  <button onClick={() => updateStatus(order.id, 'delivered')}
                    className="text-sm bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition">
                    Teslim Edildi
                  </button>
                )}
              </div>
            </div>
          ))}
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
