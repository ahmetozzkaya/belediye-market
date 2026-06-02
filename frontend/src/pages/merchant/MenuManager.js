import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function MenuManager({ restaurant }) {
  const [categories, setCategories] = useState([]);
  const [newCat, setNewCat] = useState('');
  const [addingItem, setAddingItem] = useState(null);
  const [itemForm, setItemForm] = useState({ name: '', description: '', price: '' });
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMenu = () => {
    api.get('/menu/categories')
      .then(res => setCategories(res.data))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMenu(); }, []);

  const addCategory = async (e) => {
    e.preventDefault();
    if (!newCat.trim()) return;
    try {
      await api.post('/menu/categories', { name: newCat });
      setNewCat('');
      fetchMenu();
    } catch (err) {
      alert(err.response?.data?.message || 'Kategori eklenemedi');
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Kategoriyi ve içindeki tüm ürünleri silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/menu/categories/${id}`);
      fetchMenu();
    } catch (err) {
      alert('Silinemedi');
    }
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!itemForm.name || !itemForm.price) return;
    try {
      await api.post('/menu/items', { ...itemForm, category_id: addingItem });
      setAddingItem(null);
      setItemForm({ name: '', description: '', price: '' });
      fetchMenu();
    } catch (err) {
      alert(err.response?.data?.message || 'Ürün eklenemedi');
    }
  };

  const saveItem = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/menu/items/${editingItem.id}`, editingItem);
      setEditingItem(null);
      fetchMenu();
    } catch (err) {
      alert('Güncellenemedi');
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Ürünü silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/menu/items/${id}`);
      fetchMenu();
    } catch (err) {
      alert('Silinemedi');
    }
  };

  const toggleAvailable = async (item) => {
    try {
      await api.put(`/menu/items/${item.id}`, { ...item, is_available: !item.is_available });
      fetchMenu();
    } catch (err) {
      alert('Güncellenemedi');
    }
  };

  if (loading) return <div className="text-center py-10 text-gray-500">Yükleniyor...</div>;

  return (
    <div>
      {/* Kategori Ekle */}
      <form onSubmit={addCategory} className="flex gap-2 mb-6">
        <input value={newCat} onChange={e => setNewCat(e.target.value)}
          placeholder="Yeni kategori adı (Örn: Ana Yemekler)"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
        <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition font-medium">
          + Kategori Ekle
        </button>
      </form>

      {categories.length === 0 ? (
        <div className="text-center text-gray-400 py-10">
          <p className="text-3xl mb-2">🍽️</p>
          <p>Henüz kategori yok. Yukarıdan ekleyin.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white rounded-xl shadow border border-gray-100">
              {/* Kategori Başlığı */}
              <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 rounded-t-xl">
                <h3 className="font-semibold text-gray-800">{cat.name}</h3>
                <div className="flex gap-2">
                  <button onClick={() => { setAddingItem(cat.id); setItemForm({ name: '', description: '', price: '' }); }}
                    className="text-xs bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition">
                    + Ürün Ekle
                  </button>
                  <button onClick={() => deleteCategory(cat.id)}
                    className="text-xs text-red-400 hover:text-red-600 px-2">
                    Sil
                  </button>
                </div>
              </div>

              {/* Ürün Ekleme Formu */}
              {addingItem === cat.id && (
                <form onSubmit={addItem} className="p-4 bg-red-50 border-b">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                    <input required value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})}
                      placeholder="Ürün adı *"
                      className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                    <input value={itemForm.description} onChange={e => setItemForm({...itemForm, description: e.target.value})}
                      placeholder="Açıklama"
                      className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                    <input required type="number" step="0.01" min="0" value={itemForm.price} onChange={e => setItemForm({...itemForm, price: e.target.value})}
                      placeholder="Fiyat (₺) *"
                      className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="bg-red-600 text-white px-4 py-1.5 rounded text-sm hover:bg-red-700 transition">Ekle</button>
                    <button type="button" onClick={() => setAddingItem(null)} className="text-gray-500 px-4 py-1.5 rounded text-sm hover:bg-gray-100 transition">İptal</button>
                  </div>
                </form>
              )}

              {/* Ürün Listesi */}
              <div className="divide-y">
                {(!cat.items || cat.items.length === 0) ? (
                  <p className="text-sm text-gray-400 px-4 py-3">Bu kategoride henüz ürün yok.</p>
                ) : (
                  cat.items.map(item => (
                    <div key={item.id}>
                      {editingItem?.id === item.id ? (
                        <form onSubmit={saveItem} className="p-3 bg-yellow-50 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                          <input value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})}
                            className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                          <input value={editingItem.description || ''} onChange={e => setEditingItem({...editingItem, description: e.target.value})}
                            className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                          <input type="number" step="0.01" value={editingItem.price} onChange={e => setEditingItem({...editingItem, price: e.target.value})}
                            className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                          <div className="flex gap-1">
                            <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700">Kaydet</button>
                            <button type="button" onClick={() => setEditingItem(null)} className="text-gray-500 px-3 py-1 rounded text-xs hover:bg-gray-100">İptal</button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex items-center justify-between px-4 py-3">
                          <div className="flex-1">
                            <span className={`font-medium text-sm ${!item.is_available ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                              {item.name}
                            </span>
                            {item.description && <span className="text-xs text-gray-400 ml-2">{item.description}</span>}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-red-600 text-sm">{parseFloat(item.price).toFixed(2)} ₺</span>
                            <button onClick={() => toggleAvailable(item)}
                              className={`text-xs px-2 py-1 rounded-full transition ${item.is_available ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                              {item.is_available ? 'Aktif' : 'Pasif'}
                            </button>
                            <button onClick={() => setEditingItem({...item})} className="text-xs text-blue-500 hover:text-blue-700">Düzenle</button>
                            <button onClick={() => deleteItem(item.id)} className="text-xs text-red-400 hover:text-red-600">Sil</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
