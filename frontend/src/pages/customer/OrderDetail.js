import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import socket from '../../services/socket';
import StarRating from '../../components/StarRating';

const STEPS = [
  { key: 'pending',    label: 'Sipariş Alındı' },
  { key: 'confirmed',  label: 'Onaylandı' },
  { key: 'preparing',  label: 'Hazırlanıyor' },
  { key: 'ready',      label: 'Hazır' },
  { key: 'on_the_way', label: 'Yolda' },
  { key: 'delivered',  label: 'Teslim Edildi' },
];

const STEP_INDEX = Object.fromEntries(STEPS.map((s, i) => [s.key, i]));

function StatusBar({ status }) {
  if (status === 'cancelled') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
        <p className="text-red-600 font-semibold">Sipariş İptal Edildi</p>
      </div>
    );
  }

  const current = STEP_INDEX[status] ?? 0;

  return (
    <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 right-0 top-4 h-1 bg-gray-200 mx-8 z-0">
          <div
            className="h-full bg-red-500 transition-all duration-500"
            style={{ width: `${(current / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
        {STEPS.map((step, i) => (
          <div key={step.key} className="flex flex-col items-center z-10 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
              ${i < current ? 'bg-red-500 text-white' :
                i === current ? 'bg-red-600 text-white ring-4 ring-red-100' :
                'bg-gray-200 text-gray-400'}`}>
              {i < current ? '✓' : i + 1}
            </div>
            <p className={`text-xs mt-1 text-center leading-tight hidden sm:block
              ${i <= current ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
              {step.label}
            </p>
          </div>
        ))}
      </div>
      <p className="text-center text-sm font-semibold text-red-600 mt-4 sm:hidden">
        {STEPS[current]?.label}
      </p>
    </div>
  );
}

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
      onSubmitted();
    } catch (err) {
      alert(err.response?.data?.message || 'Değerlendirme gönderilemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
      <h3 className="font-semibold text-gray-800 mb-3">Siparişinizi Değerlendirin</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <StarRating rating={rating} interactive onRate={setRating} size="lg" />
        <textarea value={comment} onChange={e => setComment(e.target.value)}
          rows={3} placeholder="Deneyiminizi paylaşın (isteğe bağlı)"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
        <button type="submit" disabled={loading || !rating}
          className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition font-medium text-sm disabled:opacity-50">
          {loading ? 'Gönderiliyor...' : 'Değerlendirmeyi Gönder'}
        </button>
      </form>
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [reviewed, setReviewed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  const fetchOrder = () => {
    api.get(`/orders/${id}`)
      .then(res => setOrder(res.data))
      .catch(() => setError('Sipariş bulunamadı veya erişim yetkiniz yok.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrder();
    api.get('/reviews/my-reviewed')
      .then(res => setReviewed(res.data.includes(parseInt(id))))
      .catch(() => {});

    socket.on('order_updated', (data) => {
      if (data.id === parseInt(id)) {
        setOrder(prev => prev ? { ...prev, status: data.status } : prev);
      }
    });
    return () => socket.off('order_updated');
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Siparişi iptal etmek istediğinize emin misiniz?')) return;
    setCancelling(true);
    try {
      await api.patch(`/orders/${id}/cancel`);
      setOrder(prev => ({ ...prev, status: 'cancelled' }));
    } catch (err) {
      alert(err.response?.data?.message || 'İptal işlemi başarısız');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="text-center mt-20 text-gray-500">Yükleniyor...</div>;

  if (error) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <p className="text-4xl mb-4">😕</p>
      <p className="text-gray-500 mb-6">{error}</p>
      <button onClick={() => navigate('/orders')} className="text-red-600 hover:underline text-sm">← Siparişlerime Dön</button>
    </div>
  );

  const canCancel = ['pending', 'confirmed'].includes(order.status);
  const canReview = order.status === 'delivered' && !reviewed;

  return (
    <div className="max-w-lg mx-auto px-4 py-8 pb-24">
      {/* Başlık */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/orders')} className="text-gray-400 hover:text-gray-600 transition">
          ←
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Sipariş #{order.id}</h1>
          <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleString('tr-TR')}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Durum Çubuğu */}
        <StatusBar status={order.status} />

        {/* Restoran Bilgisi */}
        <div className="bg-white rounded-xl shadow p-4 border border-gray-100 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-xl font-bold text-red-600 shrink-0">
            {order.restaurant_name?.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{order.restaurant_name}</p>
            <p className="text-xs text-gray-400">📍 {order.restaurant_address}</p>
          </div>
        </div>

        {/* Sipariş İçeriği */}
        <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-3">Sipariş İçeriği</h3>
          <div className="space-y-2">
            {order.items?.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.name} <span className="text-gray-400">x{item.quantity}</span></span>
                <span className="font-medium text-gray-800">{(item.unit_price * item.quantity).toFixed(2)} ₺</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-3 pt-3 border-t">
            <span className="font-semibold text-gray-700">Toplam</span>
            <span className="font-bold text-red-600 text-lg">{parseFloat(order.total_amount).toFixed(2)} ₺</span>
          </div>
        </div>

        {/* Teslimat Bilgisi */}
        <div className="bg-white rounded-xl shadow p-4 border border-gray-100 space-y-2">
          <h3 className="font-semibold text-gray-800 mb-1">Teslimat Bilgisi</h3>
          <p className="text-sm text-gray-600">📍 {order.delivery_address}</p>
          {order.notes && <p className="text-sm text-gray-500 italic">📝 {order.notes}</p>}
          {order.courier_name && (
            <div className="flex items-center gap-2 mt-1 pt-2 border-t">
              <span className="text-sm text-gray-600">🛵 Kurye:</span>
              <span className="text-sm font-medium text-indigo-600">{order.courier_name}</span>
              {order.courier_phone && (
                <a href={`tel:${order.courier_phone}`}
                  className="ml-auto text-xs text-indigo-500 underline hover:text-indigo-700">
                  {order.courier_phone}
                </a>
              )}
            </div>
          )}
          {order.status === 'on_the_way' && !order.courier_name && (
            <p className="text-sm text-orange-500">⏳ Kurye atanıyor...</p>
          )}
          {order.delivered_at && (
            <p className="text-xs text-green-600 mt-1">
              ✓ Teslim edildi: {new Date(order.delivered_at).toLocaleString('tr-TR')}
            </p>
          )}
        </div>

        {/* İptal Butonu */}
        {canCancel && (
          <button onClick={handleCancel} disabled={cancelling}
            className="w-full border border-red-300 text-red-600 py-3 rounded-xl hover:bg-red-50 transition font-medium text-sm disabled:opacity-50">
            {cancelling ? 'İptal ediliyor...' : 'Siparişi İptal Et'}
          </button>
        )}

        {/* Değerlendirme */}
        {canReview && <ReviewForm orderId={order.id} onSubmitted={() => setReviewed(true)} />}
        {order.status === 'delivered' && reviewed && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center">
            <p className="text-green-700 text-sm font-medium">✓ Bu siparişi değerlendirdiniz</p>
          </div>
        )}
      </div>
    </div>
  );
}
