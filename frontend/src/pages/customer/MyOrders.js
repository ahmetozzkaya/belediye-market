import { useState, useEffect } from 'react';
import api from '../../services/api';
import socket from '../../services/socket';

const statusLabels = {
  pending: { label: 'Bekliyor', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Onaylandı', color: 'bg-blue-100 text-blue-700' },
  preparing: { label: 'Hazırlanıyor', color: 'bg-orange-100 text-orange-700' },
  ready: { label: 'Hazırlanıyor', color: 'bg-orange-100 text-orange-700' },
  on_the_way: { label: 'Yolda 🛵', color: 'bg-indigo-100 text-indigo-700' },
  delivered: { label: 'Teslim Edildi ✓', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'İptal Edildi', color: 'bg-red-100 text-red-700' },
};

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    api.get('/orders/my')
      .then(res => setOrders(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();

    // Siparişin durumu değişince listeyi güncelle
    socket.on('order_updated', () => fetchOrders());

    return () => { socket.off('order_updated'); };
  }, []);

  if (loading) return <div className="text-center mt-20 text-gray-500">Yükleniyor...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Siparişlerim</h1>
      {orders.length === 0 ? (
        <div className="text-center text-gray-500 mt-20">
          <p className="text-4xl mb-3">📦</p>
          <p>Henüz siparişiniz bulunmuyor.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const s = statusLabels[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-700' };
            return (
              <div key={order.id} className="bg-white rounded-xl shadow p-4 border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-gray-800">{order.restaurant_name}</p>
                    <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleString('tr-TR')}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.color}`}>{s.label}</span>
                </div>
                <div className="text-sm text-gray-600 space-y-0.5">
                  {order.items?.map((item, i) => (
                    <p key={i}>{item.name} x{item.quantity} — {(item.unit_price * item.quantity).toFixed(2)} ₺</p>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t">
                  <p className="text-xs text-gray-400">📍 {order.delivery_address}</p>
                  <p className="font-semibold text-red-600">{parseFloat(order.total_amount).toFixed(2)} ₺</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
