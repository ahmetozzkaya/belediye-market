import { useState, useEffect } from 'react';
import api from '../../services/api';
import StarRating from '../../components/StarRating';

export default function MerchantReviews() {
  const [data, setData] = useState({ reviews: [], average: null, count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reviews/merchant')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stars = [5, 4, 3, 2, 1];
  const countByStar = (s) => data.reviews.filter(r => r.rating === s).length;

  if (loading) return <div className="text-center py-10 text-gray-500">Yükleniyor...</div>;

  return (
    <div>
      {data.count === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <p className="text-3xl mb-2">⭐</p>
          <p>Henüz değerlendirme bulunmuyor.</p>
        </div>
      ) : (
        <>
          {/* Özet */}
          <div className="bg-white rounded-xl shadow p-5 mb-5 flex items-center gap-8">
            <div className="text-center">
              <p className="text-5xl font-bold text-gray-800">{data.average}</p>
              <StarRating rating={Math.round(data.average)} size="md" />
              <p className="text-xs text-gray-400 mt-1">{data.count} değerlendirme</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {stars.map(s => (
                <div key={s} className="flex items-center gap-2 text-sm">
                  <span className="text-xs text-gray-500 w-4">{s}★</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: data.count ? `${(countByStar(s) / data.count) * 100}%` : '0%' }} />
                  </div>
                  <span className="text-xs text-gray-400 w-4">{countByStar(s)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Yorumlar */}
          <div className="space-y-3">
            {data.reviews.map(r => (
              <div key={r.id} className="bg-white rounded-xl shadow p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-gray-800">{r.customer_name}</span>
                  <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('tr-TR')}</span>
                </div>
                <StarRating rating={r.rating} size="sm" />
                {r.comment && <p className="text-sm text-gray-600 mt-1.5">{r.comment}</p>}
                {!r.is_visible && (
                  <span className="text-xs text-red-400 mt-1 block">Admin tarafından gizlendi</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
