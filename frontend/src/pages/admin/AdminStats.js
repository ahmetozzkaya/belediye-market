import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then(res => setStats(res.data)).catch(() => {});
  }, []);

  if (!stats) return <div className="text-center py-10 text-gray-500">Yükleniyor...</div>;

  const cards = [
    { label: 'Toplam Kullanıcı',      value: stats.total_users,                          color: 'text-blue-600',   bg: 'bg-blue-50',   icon: '👥' },
    { label: 'Aktif İşletme',         value: stats.total_restaurants,                    color: 'text-orange-600', bg: 'bg-orange-50', icon: '🏪' },
    { label: 'Onay Bekleyen',         value: stats.pending_restaurants,                  color: 'text-yellow-600', bg: 'bg-yellow-50', icon: '⏳' },
    { label: 'Tamamlanan Sipariş',    value: stats.total_orders,                         color: 'text-green-600',  bg: 'bg-green-50',  icon: '📦' },
    { label: 'Toplam Ciro',           value: `${parseFloat(stats.total_revenue || 0).toFixed(2)} ₺`,   color: 'text-indigo-600', bg: 'bg-indigo-50', icon: '💳' },
    { label: 'Platform Komisyonu',    value: `${parseFloat(stats.total_commission || 0).toFixed(2)} ₺`, color: 'text-red-600',    bg: 'bg-red-50',    icon: '💰' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {cards.map(c => (
        <div key={c.label} className={`${c.bg} rounded-xl p-5`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{c.icon}</span>
            <p className="text-sm text-gray-500">{c.label}</p>
          </div>
          <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}
