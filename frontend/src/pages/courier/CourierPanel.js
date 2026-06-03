import { useState, useEffect } from 'react';
import api from '../../services/api';
import socket from '../../services/socket';
import { playBeep } from '../../services/notify';

export default function CourierPanel() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newAlert, setNewAlert] = useState(false);

  const fetchOrders = () => {
    api.get('/orders/courier')
      .then(res => setOrders(Array.isArray(res.data) ? res.data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();

    // Yeni hazır sipariş gelince
    socket.on('order_ready', () => {
      fetchOrders();
      setNewAlert(true);
      playBeep();
      setTimeout(() => setNewAlert(false), 5000);
    });

    return () => { socket.off('order_ready'); };
  }, []);

  const updateStatus = async (orderId, status) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Güncelleme başarısız');
    }
  };

  if (loading) return <div className="text-center mt-20 text-gray-500">Yükleniyor...</div>;

  const active = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  const completed = orders.filter(o => o.status === 'delivered');

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Kurye Paneli</h1>

      {newAlert && (
        <div className="mb-4 bg-green-500 text-white px-4 py-3 rounded-xl flex items-center gap-3 animate-pulse">
          <span className="text-xl">🔔</span>
          <span className="font-semibold">Yeni teslimat hazır!</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-3xl font-bold text-red-600">{active.length}</p>
          <p className="text-sm text-gray-500">Aktif Teslimat</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{completed.length}</p>
          <p className="text-sm text-gray-500">Tamamlanan</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center text-gray-500 mt-10">
          <p className="text-4xl mb-3">🚴</p>
          <p>Aktif sipariş bulunmuyor.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
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
                <p>🏪 <span className="font-medium">Restoran:</span> {order.restaurant_address}</p>
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
    </div>
  );
}
