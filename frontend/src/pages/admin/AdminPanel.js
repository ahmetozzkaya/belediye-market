import { useState, useEffect } from 'react';
import api from '../../services/api';
import AdminStats from './AdminStats';
import AdminRestaurants from './AdminRestaurants';
import AdminCommission from './AdminCommission';
import AdminCouriers from './AdminCouriers';
import AdminUsers from './AdminUsers';
import AdminSettings from './AdminSettings';
import AdminReviews from './AdminReviews';

const TABS = [
  { key: 'stats',       label: 'Genel Bakış',      icon: '📊' },
  { key: 'restaurants', label: 'İşletmeler',        icon: '🏪' },
  { key: 'commission',  label: 'Komisyon Raporu',   icon: '💰' },
  { key: 'couriers',    label: 'Kuryeler',          icon: '🛵' },
  { key: 'reviews',     label: 'Değerlendirmeler',  icon: '⭐' },
  { key: 'users',       label: 'Kullanıcılar',      icon: '👥' },
  { key: 'settings',    label: 'Belediye',          icon: '⚙️' },
];

export default function AdminPanel() {
  const [tab, setTab] = useState('stats');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    api.get('/admin/stats').then(res => setPendingCount(res.data.pending_restaurants || 0)).catch(() => {});
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Yönetim Paneli</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition flex items-center gap-1.5 ${
              tab === t.key ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}>
            <span>{t.icon}</span>
            {t.label}
            {t.key === 'restaurants' && pendingCount > 0 && (
              <span className="bg-yellow-400 text-yellow-900 text-xs px-1.5 py-0.5 rounded-full font-bold">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'stats'       && <AdminStats />}
      {tab === 'restaurants' && <AdminRestaurants onPendingChange={setPendingCount} />}
      {tab === 'commission'  && <AdminCommission />}
      {tab === 'couriers'    && <AdminCouriers />}
      {tab === 'reviews'     && <AdminReviews />}
      {tab === 'users'       && <AdminUsers />}
      {tab === 'settings'    && <AdminSettings />}
    </div>
  );
}
