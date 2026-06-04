import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminSettings() {
  const [form, setForm] = useState({ name: '', logo_url: '', primary_color: '#E63946', secondary_color: '#1D3557' });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/municipality').then(res => { if (res.data) setForm(res.data); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    await api.put('/admin/municipality', form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <div className="text-center py-10 text-gray-500">Yükleniyor...</div>;

  return (
    <div className="max-w-md">
      <h3 className="font-semibold text-gray-800 mb-4">Belediye Bilgileri</h3>
      <div className="space-y-4 bg-white rounded-xl shadow p-5">
        {saved && <p className="bg-green-50 text-green-600 text-sm p-3 rounded">✓ Kaydedildi</p>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Belediye Adı</label>
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
          <input value={form.logo_url || ''} onChange={e => setForm({...form, logo_url: e.target.value})}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Ana Renk</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.primary_color} onChange={e => setForm({...form, primary_color: e.target.value})}
                className="h-9 w-14 rounded border cursor-pointer" />
              <span className="text-sm text-gray-500">{form.primary_color}</span>
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">İkincil Renk</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.secondary_color} onChange={e => setForm({...form, secondary_color: e.target.value})}
                className="h-9 w-14 rounded border cursor-pointer" />
              <span className="text-sm text-gray-500">{form.secondary_color}</span>
            </div>
          </div>
        </div>
        <button onClick={handleSave}
          className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition font-medium text-sm">
          Kaydet
        </button>
      </div>
    </div>
  );
}
