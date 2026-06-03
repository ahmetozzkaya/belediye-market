import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

function AddressCard({ addr, onSetDefault, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: addr.title, address: addr.address });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!form.title.trim() || !form.address.trim()) return;
    setLoading(true);
    try {
      await onUpdate(addr.id, form);
      setEditing(false);
    } finally {
      setLoading(false);
    }
  };

  if (editing) {
    return (
      <div className="border border-red-200 rounded-xl p-3 bg-red-50 space-y-2">
        <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
          placeholder="Adres başlığı"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
        <textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})}
          rows={2} placeholder="Tam adres"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={loading}
            className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs hover:bg-red-700 transition disabled:opacity-50">
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
          <button onClick={() => { setEditing(false); setForm({ title: addr.title, address: addr.address }); }}
            className="text-gray-500 px-4 py-1.5 rounded-lg text-xs hover:bg-gray-100 transition">
            İptal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-xl p-3 flex items-start justify-between gap-2 ${addr.is_default ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-medium text-sm text-gray-800">{addr.title}</span>
          {addr.is_default && <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">Varsayılan</span>}
        </div>
        <p className="text-xs text-gray-500">{addr.address}</p>
      </div>
      <div className="flex gap-1 shrink-0">
        {!addr.is_default && (
          <button onClick={() => onSetDefault(addr.id)}
            className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition">
            Varsayılan Yap
          </button>
        )}
        <button onClick={() => setEditing(true)}
          className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition">
          Düzenle
        </button>
        <button onClick={() => onDelete(addr.id)}
          className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded hover:bg-gray-100 transition">
          Sil
        </button>
      </div>
    </div>
  );
}

function AddAddressForm({ onAdd, onCancel }) {
  const [form, setForm] = useState({ title: '', address: '', is_default: false });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.address.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/addresses', form);
      onAdd(res.data);
      setForm({ title: '', address: '', is_default: false });
    } catch {
      alert('Adres eklenemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border border-red-200 rounded-xl p-4 bg-red-50 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Adres Başlığı *</label>
          <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
            placeholder="Ev, İş, Anne Evi..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-gray-700 pb-2 cursor-pointer">
            <input type="checkbox" checked={form.is_default} onChange={e => setForm({...form, is_default: e.target.checked})}
              className="accent-red-600" />
            Varsayılan yap
          </label>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Adres *</label>
        <textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})}
          rows={2} placeholder="Mahalle, cadde, sokak, kapı no..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={loading}
          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition disabled:opacity-50">
          {loading ? 'Ekleniyor...' : 'Ekle'}
        </button>
        <button type="button" onClick={onCancel}
          className="text-gray-500 px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition">
          İptal
        </button>
      </div>
    </form>
  );
}

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [addresses, setAddresses] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/addresses').then(res => setAddresses(res.data)).catch(() => {});
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.put('/auth/profile', form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Güncelleme başarısız');
    }
  };

  const handleAddAddress = (newAddr) => {
    setAddresses(prev => {
      const updated = newAddr.is_default ? prev.map(a => ({...a, is_default: false})) : prev;
      return [newAddr, ...updated].sort((a, b) => b.is_default - a.is_default);
    });
    setShowAddForm(false);
  };

  const handleSetDefault = async (id) => {
    try {
      await api.patch(`/addresses/${id}/default`);
      setAddresses(prev => prev.map(a => ({...a, is_default: a.id === id})));
    } catch { alert('İşlem başarısız'); }
  };

  const handleUpdate = async (id, form) => {
    try {
      const res = await api.put(`/addresses/${id}`, form);
      setAddresses(prev => prev.map(a => a.id === id ? { ...a, ...res.data } : a));
    } catch { alert('Güncellenemedi'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu adresi silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/addresses/${id}`);
      setAddresses(prev => prev.filter(a => a.id !== id));
    } catch { alert('Silinemedi'); }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Profilim</h1>

      {/* Kişisel Bilgiler */}
      <div className="bg-white rounded-xl shadow p-5 mb-4">
        <div className="flex items-center gap-4 mb-5 pb-4 border-b">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-2xl font-bold text-red-600">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>

        {error && <p className="bg-red-50 text-red-600 text-sm p-3 rounded mb-4">{error}</p>}
        {success && <p className="bg-green-50 text-green-600 text-sm p-3 rounded mb-4">✓ Bilgiler güncellendi</p>}

        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
              placeholder="0555 123 45 67"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
          </div>
          <button type="submit"
            className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition font-medium text-sm">
            Kaydet
          </button>
        </form>
      </div>

      {/* Adreslerim */}
      <div className="bg-white rounded-xl shadow p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Adreslerim</h2>
          {!showAddForm && (
            <button onClick={() => setShowAddForm(true)}
              className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition">
              + Yeni Adres
            </button>
          )}
        </div>

        {showAddForm && (
          <div className="mb-3">
            <AddAddressForm onAdd={handleAddAddress} onCancel={() => setShowAddForm(false)} />
          </div>
        )}

        {addresses.length === 0 && !showAddForm ? (
          <p className="text-sm text-gray-400 text-center py-4">Kayıtlı adres yok.</p>
        ) : (
          <div className="space-y-2">
            {addresses.map(addr => (
              <AddressCard key={addr.id} addr={addr} onSetDefault={handleSetDefault} onDelete={handleDelete} onUpdate={handleUpdate} />
            ))}
          </div>
        )}
      </div>

      <button onClick={() => { logout(); navigate('/login'); }}
        className="w-full bg-white border border-red-200 text-red-600 py-3 rounded-xl hover:bg-red-50 transition font-medium text-sm shadow">
        Çıkış Yap
      </button>
    </div>
  );
}
