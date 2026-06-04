import { useState, useEffect } from 'react';
import api from '../../services/api';
import StarRating from '../../components/StarRating';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reviews/admin')
      .then(res => setReviews(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (id) => {
    const res = await api.patch(`/reviews/admin/${id}/toggle`);
    setReviews(prev => prev.map(r => r.id === id ? { ...r, is_visible: res.data.is_visible } : r));
  };

  const filtered = filter === 'all' ? reviews
    : filter === 'visible' ? reviews.filter(r => r.is_visible)
    : reviews.filter(r => !r.is_visible);

  if (loading) return <div className="text-center py-10 text-gray-500">Yükleniyor...</div>;

  return (
    <div>
      <div className="flex gap-2 mb-5">
        {[['all', 'Tümü'], ['visible', 'Yayında'], ['hidden', 'Gizlenen']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === v ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {l}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-400 self-center">{filtered.length} değerlendirme</span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <p className="text-3xl mb-2">⭐</p>
          <p>Değerlendirme bulunamadı.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className={`bg-white rounded-xl shadow p-4 border ${r.is_visible ? 'border-gray-100' : 'border-red-100 bg-red-50'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-sm text-gray-800">{r.customer_name}</span>
                    <span className="text-xs text-gray-400">→</span>
                    <span className="text-sm text-orange-600 font-medium">{r.restaurant_name}</span>
                    <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('tr-TR')}</span>
                  </div>
                  <StarRating rating={r.rating} size="sm" />
                  {r.comment && <p className="text-sm text-gray-600 mt-1">{r.comment}</p>}
                  {!r.is_visible && <span className="text-xs text-red-400">Gizlendi</span>}
                </div>
                <button onClick={() => toggle(r.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg shrink-0 transition ${
                    r.is_visible
                      ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                      : 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100'
                  }`}>
                  {r.is_visible ? 'Gizle' : 'Yayına Al'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
