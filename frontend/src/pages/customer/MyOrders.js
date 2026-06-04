import { useState, useEffect } from 'react';
import api from '../../services/api';
import socket from '../../services/socket';
import StarRating from '../../components/StarRating';

const statusLabels = {
  pending:    { label: 'Bekliyor',        color: 'bg-yellow-100 text-yellow-700' },
  confirmed:  { label: 'Onaylandı',       color: 'bg-blue-100 text-blue-700' },
  preparing:  { label: 'Hazırlanıyor',    color: 'bg-orange-100 text-orange-700' },
  ready:      { label: 'Hazırlanıyor',    color: 'bg-orange-100 text-orange-700' },
  on_the_way: { label: 'Yolda 🛵',        color: 'bg-indigo-100 text-indigo-700' },
  delivered:  { label: 'Teslim Edildi ✓', color: 'bg-green-100 text-green-700' },
  cancelled:  { label: 'İptal Edildi',    color: 'bg-red-100 text-red-700' },
};

function ReviewForm({ orderId, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) return alert('Lütfen yıldız seçin');
    setLoading(true);
    try {
      await api.post('/reviews', { order_id: orderId, rating, comment });
      onSubmitted(orderId);
    } catch (err) {
      alert(err.response?.data?.message || 'Değerlendirme gönderilemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 pt-3 border-t border-gray-100">
      <p className="text-sm font-medium text-gray-700 mb-2">Siparişinizi değerlendirin</p>
      <StarRating rating={rating} interactive onRate={setRating} size="lg" />
      <textarea value={comment} onChange={e => setComment(e.target.value)}
        rows={2} placeholder="Yorum ekleyin (isteğe bağlı)"
        className="w-full mt-2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
      <button type="submit" disabled={loading || !rating}
        className="mt-2 bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-red-700 transition disabled:opacity-50">
        {loading ? 'Gönderiliyor...' : 'Değerlendirmeyi Gönder'}
      </button>
    </form>
  );
}

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [reviewedOrderIds, setReviewedOrderIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    api.get('/orders/my').then(res => setOrders(res.data)).catch(() => {});
  };

  useEffect(() => {
    fetchOrders();
    api.get('/reviews/my-reviewed')
      .then(res => setReviewedOrderIds(new Set(res.data)))
      .catch(() => {});
    api.get('/orders/my').finally(() => setLoading(false));
    socket.on('order_updated', () => fetchOrders());
    return () => { socket.off('order_updated'); };
  }, []);

  const handleReviewed = (orderId) => {
    setReviewedOrderIds(prev => new Set([...prev, orderId]));
  };

  if (loading) return <div className="text-center mt-20 text-gray-500">Yükleniyor...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
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
            const canReview = order.status === 'delivered' && !reviewedOrderIds.has(order.id);
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
                {reviewedOrderIds.has(order.id) && (
                  <p className="text-xs text-green-600 mt-2">✓ Değerlendirdiniz</p>
                )}
                {canReview && (
                  <ReviewForm orderId={order.id} onSubmitted={handleReviewed} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
