import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import socket from '../../services/socket';
import StarRating from '../../components/StarRating';

const PAGE_SIZE = 10;

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
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [reviewedOrderIds, setReviewedOrderIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchOrders = useCallback((p = page) => {
    api.get(`/orders/my?limit=${PAGE_SIZE}&offset=${p * PAGE_SIZE}`)
      .then(res => {
        setOrders(res.data.orders);
        setTotal(res.data.total);
      })
      .catch(() => {});
  }, [page]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/orders/my?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`),
      api.get('/reviews/my-reviewed'),
    ]).then(([ordersRes, reviewsRes]) => {
      setOrders(ordersRes.data.orders);
      setTotal(ordersRes.data.total);
      setReviewedOrderIds(new Set(reviewsRes.data));
    }).catch(() => {}).finally(() => setLoading(false));

    socket.on('order_updated', () => fetchOrders(page));
    return () => { socket.off('order_updated'); };
  }, [page]);

  const handleCancel = async (orderId) => {
    if (!window.confirm('Siparişi iptal etmek istediğinize emin misiniz?')) return;
    setCancellingId(orderId);
    try {
      await api.patch(`/orders/${orderId}/cancel`);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
    } catch (err) {
      alert(err.response?.data?.message || 'İptal işlemi başarısız');
    } finally {
      setCancellingId(null);
    }
  };

  const handleReviewed = (orderId) => {
    setReviewedOrderIds(prev => new Set([...prev, orderId]));
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (loading) return <div className="text-center mt-20 text-gray-500">Yükleniyor...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Siparişlerim</h1>
        {total > 0 && <span className="text-sm text-gray-400">{total} sipariş</span>}
      </div>

      {orders.length === 0 ? (
        <div className="text-center text-gray-500 mt-20">
          <p className="text-4xl mb-3">📦</p>
          <p>Henüz siparişiniz bulunmuyor.</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map(order => {
              const s = statusLabels[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-700' };
              const canReview = order.status === 'delivered' && !reviewedOrderIds.has(order.id);
              return (
                <div key={order.id} className="bg-white rounded-xl shadow p-4 border border-gray-100 cursor-pointer hover:shadow-md transition"
                onClick={() => navigate(`/orders/${order.id}`)}>
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
                  {canReview && <div onClick={e => e.stopPropagation()}><ReviewForm orderId={order.id} onSubmitted={handleReviewed} /></div>}
                  {['pending', 'confirmed'].includes(order.status) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCancel(order.id); }}
                      disabled={cancellingId === order.id}
                      className="mt-3 w-full text-sm text-red-600 border border-red-300 rounded-lg py-1.5 hover:bg-red-50 transition disabled:opacity-50">
                      {cancellingId === order.id ? 'İptal ediliyor...' : 'Siparişi İptal Et'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

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
        </>
      )}
    </div>
  );
}
