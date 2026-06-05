import { useState } from 'react';
import api from '../../services/api';

const ALL_CATEGORIES = [
  'Kahvaltı', 'Ev Yemeği', 'Izgara', 'Kebap', 'Köfte',
  'Pide & Lahmacun', 'Pizza', 'Burger', 'Fast Food',
  'Makarna', 'Börek', 'Pastane', 'Tatlı', 'Kafe', 'İçecek',
];

export default function RestaurantSetup({ existing, onCreated, onUpdated }) {
  const [form, setForm] = useState({
    name: existing?.name || '',
    description: existing?.description || '',
    address: existing?.address || '',
    phone: existing?.phone || '',
    courier_type: existing?.courier_type || 'own',
    categories: existing?.categories || [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const toggleCategory = (cat) => {
    setForm(prev => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (existing) {
        const res = await api.put('/menu/restaurant', form);
        onUpdated(res.data);
      } else {
        const res = await api.post('/menu/restaurant', form);
        onCreated(res.data);
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'İşlem başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={existing ? '' : 'min-h-screen bg-gray-50 flex items-center justify-center py-8'}>
      <div className={`bg-white rounded-xl shadow p-6 ${existing ? '' : 'w-full max-w-lg'}`}>
        {!existing && (
          <div className="text-center mb-6">
            <p className="text-4xl mb-2">🏪</p>
            <h2 className="text-xl font-bold text-gray-800">İşletmenizi Oluşturun</h2>
            <p className="text-sm text-gray-500 mt-1">Müşterilere görünmek için işletme bilgilerinizi girin.</p>
          </div>
        )}

        {error && <p className="bg-red-50 text-red-600 text-sm p-3 rounded mb-4">{error}</p>}
        {success && <p className="bg-green-50 text-green-600 text-sm p-3 rounded mb-4">✓ Kaydedildi</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">İşletme Adı *</label>
            <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              placeholder="Örn: Ahmet'in Köftecisi"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              rows={2} placeholder="İşletmenizi kısaca tanıtın"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adres *</label>
            <input required value={form.address} onChange={e => setForm({...form, address: e.target.value})}
              placeholder="Tam adres"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
              placeholder="0555 123 45 67"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategoriler
              <span className="text-xs text-gray-400 ml-1">(birden fazla seçilebilir)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIES.map(cat => (
                <button key={cat} type="button" onClick={() => toggleCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    form.categories.includes(cat)
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kurye Tercihi</label>
            <select value={form.courier_type} onChange={e => setForm({...form, courier_type: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
              <option value="own">Kendi Kuryemi Kullanırım</option>
              <option value="municipality">Belediye Kuryesi Kullanırım</option>
              <option value="both">Her İkisi de Olur</option>
            </select>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition font-medium text-sm disabled:opacity-50">
            {loading ? 'Kaydediliyor...' : existing ? 'Güncelle' : 'İşletme Oluştur'}
          </button>
        </form>
      </div>
    </div>
  );
}
