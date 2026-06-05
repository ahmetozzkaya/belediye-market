import { useState, useEffect } from 'react';
import api from '../../services/api';

const DAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

const defaultHours = () =>
  Array.from({ length: 7 }, (_, i) => ({
    day_of_week: i,
    open_time: i === 0 ? '10:00' : '09:00',
    close_time: i === 0 ? '21:00' : '22:00',
    is_closed: false,
  }));

export default function WorkingHours() {
  const [hours, setHours] = useState(defaultHours());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/menu/hours')
      .then(res => {
        if (res.data.length === 7) {
          setHours(res.data.map(h => ({
            ...h,
            open_time: h.open_time?.slice(0, 5) || '09:00',
            close_time: h.close_time?.slice(0, 5) || '22:00',
          })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const update = (index, field, value) => {
    setHours(prev => prev.map((h, i) => i === index ? { ...h, [field]: value } : h));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      await api.put('/menu/hours', { hours });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Yükleniyor...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Çalışma Saatleri</h2>
          <p className="text-xs text-gray-500 mt-0.5">Kapalı günlerde sipariş alınmaz.</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-5 py-2 rounded-xl text-sm font-semibold transition">
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          ✅ Çalışma saatleri kaydedildi.
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          ⚠️ {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
        {hours.map((h, i) => (
          <div key={h.day_of_week} className={`flex items-center gap-4 px-5 py-4 ${h.is_closed ? 'opacity-50' : ''}`}>
            <span className="w-24 text-sm font-medium text-gray-700 shrink-0">{DAY_NAMES[h.day_of_week]}</span>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => update(i, 'is_closed', !h.is_closed)}
                className={`w-10 h-5 rounded-full transition relative ${h.is_closed ? 'bg-gray-300' : 'bg-green-500'}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${h.is_closed ? 'left-0.5' : 'left-5'}`} />
              </div>
              <span className="text-xs text-gray-500">{h.is_closed ? 'Kapalı' : 'Açık'}</span>
            </label>

            <div className="flex items-center gap-2 ml-auto">
              <input
                type="time" value={h.open_time} disabled={h.is_closed}
                onChange={e => update(i, 'open_time', e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 disabled:bg-gray-50 disabled:text-gray-400"
              />
              <span className="text-gray-400 text-sm">—</span>
              <input
                type="time" value={h.close_time} disabled={h.is_closed}
                onChange={e => update(i, 'close_time', e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
