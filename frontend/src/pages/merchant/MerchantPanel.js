import { useState, useEffect } from 'react';
import api from '../../services/api';
import RestaurantSetup from './RestaurantSetup';
import MenuManager from './MenuManager';
import OrderManager from './OrderManager';

export default function MerchantPanel() {
  const [restaurant, setRestaurant] = useState(undefined);
  const [tab, setTab] = useState('orders');

  useEffect(() => {
    api.get('/menu/restaurant')
      .then(res => setRestaurant(res.data))
      .catch(() => setRestaurant(null));
  }, []);

  if (restaurant === undefined) return <div className="text-center mt-20 text-gray-500">Yükleniyor...</div>;

  if (!restaurant) {
    return <RestaurantSetup onCreated={setRestaurant} />;
  }

  const tabs = [
    { key: 'orders', label: 'Siparişler' },
    { key: 'menu', label: 'Menü Yönetimi' },
    { key: 'profile', label: 'İşletme Profili' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{restaurant.name}</h1>
          <p className="text-sm text-gray-500">📍 {restaurant.address}</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${restaurant.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {restaurant.is_active ? 'Aktif' : 'Pasif'}
        </span>
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${tab === t.key ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'orders' && <OrderManager restaurantId={restaurant.id} />}
      {tab === 'menu' && <MenuManager restaurant={restaurant} />}
      {tab === 'profile' && <RestaurantSetup existing={restaurant} onUpdated={setRestaurant} />}
    </div>
  );
}
