import { useState, useEffect } from 'react';
import api from '../../services/api';

const PERIODS = [
  { value: '1h',  label: 'Son 1 Saat' },
  { value: '6h',  label: 'Son 6 Saat' },
  { value: '12h', label: 'Son 12 Saat' },
  { value: '24h', label: 'Son 24 Saat' },
  { value: '7d',  label: 'Son 1 Hafta' },
  { value: '30d', label: 'Son 1 Ay' },
  { value: 'all', label: 'Tümü' },
  { value: 'custom', label: 'Özel Aralık' },
];

const toLocalInput = (date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export default function EarningsReport() {
  const [period, setPeriod] = useState('7d');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState({ orders: [], totals: { gross: 0, commission: 0, net: 0 } });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const fetchEarnings = () => {
    setLoading(true);
    let url = '/menu/earnings';
    if (period === 'custom' && from && to) {
      url += `?from=${encodeURIComponent(new Date(from).toISOString())}&to=${encodeURIComponent(new Date(to).toISOString())}`;
    } else if (period !== 'custom') {
      url += `?period=${period}`;
    } else {
      setLoading(false);
      return;
    }
    api.get(url)
      .then(res => { setData(res.data); setPage(1); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (period !== 'custom') fetchEarnings();
    else setLoading(false);
  }, [period]);

  const handleCustomApply = () => {
    if (!from || !to) return alert('Başlangıç ve bitiş tarihini girin');
    if (new Date(from) >= new Date(to)) return alert('Başlangıç tarihi bitiş tarihinden önce olmalı');
    fetchEarnings();
  };

  const fmt = (n) => parseFloat(n || 0).toFixed(2);

  return (
    <div>
      {/* Filtre Alanı */}
      <div className="bg-white rounded-xl shadow p-4 mb-5 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Zaman Aralığı</label>
          <select value={period} onChange={e => setPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white min-w-[160px]">
            {PERIODS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {period === 'custom' && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Başlangıç</label>
              <input type="datetime-local" value={from} onChange={e => setFrom(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bitiş</label>
              <input type="datetime-local" value={to} onChange={e => setTo(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
            </div>
            <button onClick={handleCustomApply}
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition font-medium self-end">
              Uygula
            </button>
          </>
        )}

        {period !== 'custom' && data.orders.length > 0 && (
          <p className="text-xs text-gray-400 self-end pb-2">
            {data.orders.length} sipariş listeleniyor
          </p>
        )}
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Yükleniyor...</div>
      ) : period === 'custom' && !from && !to ? (
        <div className="text-center py-10 text-gray-400">
          <p className="text-3xl mb-2">📅</p>
          <p>Tarih aralığı seçip "Uygula" butonuna basın.</p>
        </div>
      ) : data.orders.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <p className="text-3xl mb-2">📊</p>
          <p>Bu dönemde tamamlanan sipariş bulunamadı.</p>
        </div>
      ) : (
        <>
          {/* Tablo */}
          {(() => {
            const totalPages = Math.ceil(data.orders.length / PAGE_SIZE);
            const paged = data.orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
            return (
              <div className="bg-white rounded-xl shadow overflow-hidden mb-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                      <tr>
                        <th className="text-left px-4 py-3">Tarih / Saat</th>
                        <th className="text-left px-4 py-3">Ürünler</th>
                        <th className="text-right px-4 py-3">Brüt Tutar</th>
                        <th className="text-right px-4 py-3">Komisyon</th>
                        <th className="text-right px-4 py-3 text-green-700">Net Kazanç</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paged.map(order => (
                        <tr key={order.order_id} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <p className="font-medium text-gray-700">
                              {new Date(order.created_at).toLocaleDateString('tr-TR')}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(order.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-gray-700 max-w-xs">
                            {order.items.map((item, i) => (
                              <span key={i} className="inline-block text-xs bg-gray-100 rounded px-2 py-0.5 mr-1 mb-1">
                                {item.name} x{item.quantity}
                              </span>
                            ))}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700 whitespace-nowrap">
                            {fmt(order.gross_amount)} ₺
                          </td>
                          <td className="px-4 py-3 text-right text-red-500 whitespace-nowrap">
                            -{fmt(order.commission)} ₺
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-green-700 whitespace-nowrap">
                            {fmt(order.net_amount)} ₺
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Sayfalama */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                    <p className="text-xs text-gray-500">
                      {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, data.orders.length)} / {data.orders.length} sipariş
                    </p>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setPage(1)} disabled={page === 1}
                        className="px-2 py-1 rounded text-xs text-gray-500 hover:bg-gray-200 disabled:opacity-30 transition">«</button>
                      <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                        className="px-3 py-1 rounded text-xs text-gray-500 hover:bg-gray-200 disabled:opacity-30 transition">‹ Önceki</button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                        .reduce((acc, n, i, arr) => {
                          if (i > 0 && n - arr[i - 1] > 1) acc.push('...');
                          acc.push(n);
                          return acc;
                        }, [])
                        .map((n, i) => n === '...' ? (
                          <span key={i} className="px-2 text-xs text-gray-400">…</span>
                        ) : (
                          <button key={n} onClick={() => setPage(n)}
                            className={`px-3 py-1 rounded text-xs transition ${page === n ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}>
                            {n}
                          </button>
                        ))
                      }
                      <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
                        className="px-3 py-1 rounded text-xs text-gray-500 hover:bg-gray-200 disabled:opacity-30 transition">Sonraki ›</button>
                      <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
                        className="px-2 py-1 rounded text-xs text-gray-500 hover:bg-gray-200 disabled:opacity-30 transition">»</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Toplam */}
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Dönem Toplamı</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Brüt Ciro</p>
                <p className="text-xl font-bold text-gray-800">{fmt(data.totals.gross)} ₺</p>
              </div>
              <div className="text-center bg-red-50 rounded-xl p-3">
                <p className="text-xs text-red-500 mb-1">Komisyon</p>
                <p className="text-xl font-bold text-red-600">-{fmt(data.totals.commission)} ₺</p>
              </div>
              <div className="text-center bg-green-50 rounded-xl p-3">
                <p className="text-xs text-green-600 mb-1">Net Kazanç</p>
                <p className="text-xl font-bold text-green-700">{fmt(data.totals.net)} ₺</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
