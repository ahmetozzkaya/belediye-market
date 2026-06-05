import { useState, useEffect } from 'react';
import api from '../../services/api';

const StatCard = ({ label, value, icon, gradient, textColor }) => (
  <div className={`relative overflow-hidden rounded-2xl p-5 ${gradient} shadow-sm`}>
    <div className="flex items-start justify-between mb-4">
      <div className={`w-10 h-10 rounded-xl bg-white/30 flex items-center justify-center text-xl`}>
        {icon}
      </div>
    </div>
    <p className={`text-2xl font-bold ${textColor} mb-0.5`}>{value}</p>
    <p className={`text-sm font-medium ${textColor} opacity-70`}>{label}</p>
  </div>
);

export default function AdminStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then(res => setStats(res.data)).catch(() => {});
  }, []);

  if (!stats) return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-2xl bg-gray-100 animate-pulse h-28" />
      ))}
    </div>
  );

  const cards = [
    { label: 'Toplam Kullanıcı',   value: stats.total_users,      icon: '👥', gradient: 'bg-gradient-to-br from-blue-500 to-blue-600',     textColor: 'text-white' },
    { label: 'Aktif İşletme',      value: stats.total_restaurants, icon: '🏪', gradient: 'bg-gradient-to-br from-orange-400 to-orange-500',  textColor: 'text-white' },
    { label: 'Onay Bekleyen',      value: stats.pending_restaurants, icon: '⏳', gradient: stats.pending_restaurants > 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500' : 'bg-gradient-to-br from-gray-400 to-gray-500', textColor: 'text-white' },
    { label: 'Tamamlanan Sipariş', value: stats.total_orders,      icon: '📦', gradient: 'bg-gradient-to-br from-emerald-500 to-green-600',  textColor: 'text-white' },
    { label: 'Toplam Ciro',        value: `${parseFloat(stats.total_revenue || 0).toLocaleString('tr-TR', {minimumFractionDigits: 2})} ₺`, icon: '💳', gradient: 'bg-gradient-to-br from-indigo-500 to-violet-600', textColor: 'text-white' },
    { label: 'Platform Komisyonu', value: `${parseFloat(stats.total_commission || 0).toLocaleString('tr-TR', {minimumFractionDigits: 2})} ₺`, icon: '💰', gradient: 'bg-gradient-to-br from-red-500 to-rose-600', textColor: 'text-white' },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {cards.map(c => <StatCard key={c.label} {...c} />)}
      </div>
      <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-2xl p-5">
        <h3 className="font-semibold text-gray-800 mb-1">Platform Özeti</h3>
        <p className="text-sm text-gray-500">
          Ortalama sipariş tutarı:{' '}
          <span className="font-semibold text-gray-700">
            {stats.total_orders > 0
              ? `${(stats.total_revenue / stats.total_orders).toLocaleString('tr-TR', {minimumFractionDigits: 2})} ₺`
              : '—'}
          </span>
          {' · '}
          Komisyon oranı:{' '}
          <span className="font-semibold text-gray-700">
            {stats.total_revenue > 0
              ? `%${((stats.total_commission / stats.total_revenue) * 100).toFixed(1)}`
              : '—'}
          </span>
        </p>
      </div>
    </div>
  );
}
