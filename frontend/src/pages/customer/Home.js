import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/restaurants')
      .then(res => setRestaurants(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center mt-20 text-gray-500">Yükleniyor...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Restoranlar</h1>
      {restaurants.length === 0 ? (
        <div className="text-center text-gray-500 mt-20">
          <p className="text-4xl mb-3">🍽️</p>
          <p>Henüz kayıtlı işletme bulunmuyor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {restaurants.map(r => (
            <Link key={r.id} to={`/restaurant/${r.id}`}
              className="bg-white rounded-xl shadow hover:shadow-md transition overflow-hidden border border-gray-100">
              <div className="h-32 bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                <span className="text-5xl">🍴</span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800">{r.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{r.description || 'Açıklama yok'}</p>
                <p className="text-xs text-gray-400 mt-2">📍 {r.address}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
