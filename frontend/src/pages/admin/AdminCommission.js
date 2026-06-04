import { useState, useEffect } from 'react';
import api from '../../services/api';

const PERIODS = [
  { value: '7d',  label: 'Son 1 Hafta' },
  { value: '30d', label: 'Son 1 Ay' },
  { value: '90d', label: 'Son 3 Ay' },
  { value: 'all', label: 'Tümü' },
];

export default function AdminCommission() {
  const [period, setPeriod] = useState('30d');
  const [data, setData] = useState({ restaurants: [], totals: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/commission?period=${period}`)
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const fmt = (n) => parseFloat(n || 0).toFixed(2);

  return (
    <div>
      <div className="flex gap-2 mb-5 flex-wrap items-center">
        {PERIODS.map(p => (
          <button key={p.value} onClick={() => setPeriod(p.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              period === p.value ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}>
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Yükleniyor...</div>
      ) : (
        <>
          {/* Platform toplamları */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            {[
              { label: 'Toplam Sipariş',   value: data.totals.orders,                     color: 'text-blue-600',   bg: 'bg-blue-50' },
              { label: 'Brüt Ciro',        value: `${fmt(data.totals.gross)} ₺`,           color: 'text-gray-700',   bg: 'bg-gray-50' },
              { label: 'Platform Geliri',  value: `${fmt(data.totals.commission)} ₺`,      color: 'text-red-600',    bg: 'bg-red-50' },
              { label: 'Esnaf Kazancı',    value: `${fmt(data.totals.net)} ₺`,             color: 'text-green-600',  bg: 'bg-green-50' },
            ].map(c => (
              <div key={c.label} className={`${c.bg} rounded-xl p-4 text-center`}>
                <p className="text-xs text-gray-500 mb-1">{c.label}</p>
                <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* İşletme bazlı tablo */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="text-left px-4 py-3">İşletme</th>
                    <th className="text-right px-4 py-3">Sipariş</th>
                    <th className="text-right px-4 py-3">Brüt Ciro</th>
                    <th className="text-right px-4 py-3">Komisyon</th>
                    <th className="text-right px-4 py-3 text-green-700">Esnaf Kazancı</th>
                  </tr>
                </thead>
                <tbody>
                  {data.restaurants.map(r => (
                    <tr key={r.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{r.restaurant_name}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{r.order_count || 0}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{fmt(r.gross_total)} ₺</td>
                      <td className="px-4 py-3 text-right text-red-500">{fmt(r.commission_total)} ₺</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-700">{fmt(r.net_total)} ₺</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
