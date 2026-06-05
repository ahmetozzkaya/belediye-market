import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getGradient, getCategoryEmoji } from '../../utils/restaurant';

const CATEGORIES = [
  { label: 'Tümü',            value: '',               icon: '🍽️' },
  { label: 'Kahvaltı',        value: 'Kahvaltı',       icon: '🥗' },
  { label: 'Ev Yemeği',       value: 'Ev Yemeği',      icon: '🍲' },
  { label: 'Izgara',          value: 'Izgara',         icon: '🥩' },
  { label: 'Kebap',           value: 'Kebap',          icon: '🍢' },
  { label: 'Köfte',           value: 'Köfte',          icon: '🍖' },
  { label: 'Pide & Lahmacun', value: 'Pide & Lahmacun', icon: '🫓' },
  { label: 'Pizza',           value: 'Pizza',          icon: '🍕' },
  { label: 'Burger',          value: 'Burger',         icon: '🍔' },
  { label: 'Börek',           value: 'Börek',          icon: '🥐' },
  { label: 'Pastane',         value: 'Pastane',        icon: '🎂' },
  { label: 'Tatlı',           value: 'Tatlı',          icon: '🍰' },
  { label: 'Kafe',            value: 'Kafe',           icon: '☕' },
];

export default function Home() {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchRestaurants = useCallback((s, c) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (s) params.append('search', s);
    if (c) params.append('category', c);
    api.get(`/restaurants?${params}`)
      .then(res => setRestaurants(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchRestaurants(search, category); }, [search, category]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24">
      {/* Hoşgeldin */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-800">Merhaba, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-sm text-gray-500">Ne yemek istersiniz?</p>
      </div>

      {/* Arama */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-5">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="İşletme veya yemek ara..."
            className="w-full border border-gray-300 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          {searchInput && (
            <button type="button" onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">✕</button>
          )}
        </div>
        <button type="submit"
          className="bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 transition">
          Ara
        </button>
      </form>

      {/* Kategori Filtreleri */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
        {CATEGORIES.map(c => (
          <button key={c.value} onClick={() => setCategory(c.value === category ? '' : c.value)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition shrink-0 ${
              category === c.value
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-red-300'
            }`}>
            <span>{c.icon}</span>
            {c.label}
          </button>
        ))}
      </div>

      {/* Aktif filtre bilgisi */}
      {(search || category) && (
        <div className="flex items-center gap-2 mb-4">
          <p className="text-sm text-gray-500">
            {[search && `"${search}"`, category && CATEGORIES.find(c => c.value === category)?.label]
              .filter(Boolean).join(' · ')} için sonuçlar
          </p>
          <button onClick={() => { setSearch(''); setSearchInput(''); setCategory(''); }}
            className="text-xs text-red-500 hover:underline">Temizle</button>
        </div>
      )}

      {/* Restoran Listesi */}
      {loading ? (
        <div className="text-center mt-16 text-gray-500">Yükleniyor...</div>
      ) : restaurants.length === 0 ? (
        <div className="text-center mt-16 text-gray-400">
          <p className="text-5xl mb-3">🍽️</p>
          <p className="font-medium text-gray-500">Sonuç bulunamadı</p>
          <p className="text-sm mt-1">Farklı bir arama deneyin</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {restaurants.map(r => (
            <Link key={r.id} to={`/restaurant/${r.id}`}
              className="bg-white rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden border border-gray-100 active:scale-95">
              {r.logo_url ? (
                <img src={r.logo_url} alt={r.name} className="h-32 w-full object-cover" />
              ) : (
                <div className={`h-32 bg-gradient-to-br ${getGradient(r.name)} flex items-center justify-center`}>
                  <span className="text-5xl">{getCategoryEmoji(r.categories)}</span>
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-gray-800">{r.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${r.is_open ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {r.is_open ? 'Açık' : 'Kapalı'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 line-clamp-2">{r.description || 'Lezzetli yemekler sizi bekliyor'}</p>
                {r.categories?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {r.categories.map(cat => (
                      <span key={cat} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{cat}</span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-2">📍 {r.address}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
