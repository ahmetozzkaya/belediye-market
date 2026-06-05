import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StarRating from '../../components/StarRating';
import { getGradient, getCategoryEmoji, getItemEmoji } from '../../utils/restaurant';

const LAST_ADDRESS_KEY = 'lastSelectedAddressId';

export default function RestaurantDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [reviewData, setReviewData] = useState({ reviews: [], average: null, count: 0 });
  const [cart, setCart] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ title: '', address: '' });
  const [notes, setNotes] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get(`/restaurants/${id}`).then(res => setRestaurant(res.data)).catch(console.error);
    api.get(`/reviews/restaurant/${id}`).then(res => setReviewData(res.data)).catch(() => {});
    api.get('/addresses').then(res => {
      const addrs = res.data;
      setAddresses(addrs);
      if (addrs.length > 0) {
        const lastId = parseInt(localStorage.getItem(LAST_ADDRESS_KEY));
        const lastExists = addrs.find(a => a.id === lastId);
        const defaultAddr = addrs.find(a => a.is_default);
        setSelectedAddressId(lastExists ? lastId : (defaultAddr?.id || addrs[0].id));
      }
    }).catch(() => {});
  }, [id]);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.menu_item_id === item.id);
      if (existing) return prev.map(i => i.menu_item_id === item.id ? {...i, quantity: i.quantity + 1} : i);
      return [...prev, { menu_item_id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const decreaseFromCart = (itemId) => {
    setCart(prev => {
      const existing = prev.find(i => i.menu_item_id === itemId);
      if (!existing || existing.quantity <= 1) return prev.filter(i => i.menu_item_id !== itemId);
      return prev.map(i => i.menu_item_id === itemId ? {...i, quantity: i.quantity - 1} : i);
    });
  };

  const removeFromCart = (itemId) => setCart(prev => prev.filter(i => i.menu_item_id !== itemId));

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleSelectAddress = (addrId) => {
    setSelectedAddressId(addrId);
    localStorage.setItem(LAST_ADDRESS_KEY, addrId);
    setShowNewAddress(false);
  };

  const handleAddNewAddress = async () => {
    if (!newAddress.title.trim() || !newAddress.address.trim()) return alert('Başlık ve adres zorunludur');
    try {
      const res = await api.post('/addresses', newAddress);
      const added = res.data;
      setAddresses(prev => [added, ...prev]);
      handleSelectAddress(added.id);
      setNewAddress({ title: '', address: '' });
      setShowNewAddress(false);
    } catch { alert('Adres eklenemedi'); }
  };

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);

  const placeOrder = async () => {
    if (!user) return navigate('/login');
    const deliveryAddress = selectedAddress?.address;
    if (!deliveryAddress) return alert('Lütfen bir teslimat adresi seçin');
    setOrdering(true);
    try {
      await api.post('/orders', {
        restaurant_id: parseInt(id),
        items: cart.map(i => ({ menu_item_id: i.menu_item_id, quantity: i.quantity })),
        delivery_address: deliveryAddress,
        notes,
      });
      setSuccess(true);
      setCart([]);
    } catch (err) {
      alert(err.response?.data?.message || 'Sipariş verilemedi');
    } finally {
      setOrdering(false);
    }
  };

  const cartQty = (itemId) => cart.find(i => i.menu_item_id === itemId)?.quantity || 0;

  if (!restaurant) return <div className="text-center mt-20 text-gray-500">Yükleniyor...</div>;

  if (success) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow text-center">
        <p className="text-5xl mb-4">✅</p>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Siparişiniz Alındı!</h2>
        <p className="text-gray-500 mb-6">İşletme siparişinizi onaylayacak.</p>
        <button onClick={() => { setSuccess(false); navigate('/orders'); }}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition">
          Siparişlerim
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Geri butonu + Banner + Restoran bilgisi — full width, grid dışında */}
      <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 text-sm mb-4 flex items-center gap-1 transition">
        ← Geri
      </button>

      <div className="rounded-2xl overflow-hidden mb-5 shadow-sm">
        {restaurant.logo_url ? (
          <img src={restaurant.logo_url} alt={restaurant.name} className="w-full h-48 object-cover" />
        ) : (
          <div className={`h-48 bg-gradient-to-br ${getGradient(restaurant.name)} flex items-center justify-center`}>
            <span className="text-8xl">{getCategoryEmoji(restaurant.categories)}</span>
          </div>
        )}
      </div>

      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">{restaurant.name}</h1>
        {restaurant.description && <p className="text-sm text-gray-500 mb-2">{restaurant.description}</p>}
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-gray-400 text-sm">📍 {restaurant.address}</p>
          {reviewData.average && (
            <div className="flex items-center gap-1">
              <StarRating rating={Math.round(reviewData.average)} size="sm" />
              <span className="text-sm font-semibold text-gray-700">{reviewData.average}</span>
              <span className="text-xs text-gray-400">({reviewData.count} değerlendirme)</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid: menü + sepet — ikisi aynı hizadan başlar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Menü */}
      <div className="lg:col-span-2">
        {restaurant.menu?.map(cat => (
          <div key={cat.id} className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-1">{cat.name}</h3>
            <div className="space-y-2">
              {cat.items?.filter(i => i.id).map(item => (
                <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-2xl shrink-0">{getItemEmoji(item.name)}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800">{item.name}</p>
                      {item.description && <p className="text-sm text-gray-500 truncate">{item.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-red-600">{parseFloat(item.price).toFixed(2)} ₺</span>
                    {item.is_available ? (
                      cartQty(item.id) > 0 ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => decreaseFromCart(item.id)}
                            className="bg-red-100 text-red-600 w-7 h-7 rounded-full hover:bg-red-200 transition font-bold text-lg leading-none">−</button>
                          <span className="w-5 text-center text-sm font-semibold text-gray-800">{cartQty(item.id)}</span>
                          <button onClick={() => addToCart(item)}
                            className="bg-red-600 text-white w-7 h-7 rounded-full hover:bg-red-700 transition font-bold text-lg leading-none">+</button>
                        </div>
                      ) : (
                        <button onClick={() => addToCart(item)}
                          className="bg-red-600 text-white w-8 h-8 rounded-full hover:bg-red-700 transition text-lg font-bold">+</button>
                      )
                    ) : (
                      <span className="text-xs text-gray-400">Mevcut değil</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      {/* Değerlendirmeler */}
      {reviewData.reviews.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Değerlendirmeler</h3>
          <div className="space-y-3">
            {reviewData.reviews.map(r => (
              <div key={r.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-gray-800">{r.customer_name}</span>
                  <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('tr-TR')}</span>
                </div>
                <StarRating rating={r.rating} size="sm" />
                {r.comment && <p className="text-sm text-gray-600 mt-1">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      </div>

      {/* Sepet — menü ile aynı hizada başlar */}
      <div className="bg-white rounded-xl shadow p-4 h-fit sticky top-4">
        <h3 className="font-bold text-gray-800 mb-3">Sepet</h3>
        {cart.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">Sepetiniz boş</p>
        ) : (
          <>
            {cart.map(i => (
              <div key={i.menu_item_id} className="flex items-center justify-between text-sm mb-2">
                <span className="flex-1 text-gray-700 truncate mr-2">{i.name}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => decreaseFromCart(i.menu_item_id)}
                    className="text-red-400 hover:text-red-600 w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-50 font-bold">−</button>
                  <span className="w-4 text-center text-xs font-semibold">{i.quantity}</span>
                  <button onClick={() => addToCart({ id: i.menu_item_id, name: i.name, price: i.price })}
                    className="text-red-400 hover:text-red-600 w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-50 font-bold">+</button>
                  <span className="text-red-600 font-medium ml-1">{(i.price * i.quantity).toFixed(2)} ₺</span>
                  <button onClick={() => removeFromCart(i.menu_item_id)} className="text-gray-300 hover:text-red-400 text-xs ml-1">✕</button>
                </div>
              </div>
            ))}
            <div className="border-t pt-2 mt-2 font-semibold flex justify-between mb-4">
              <span>Toplam</span>
              <span className="text-red-600">{total.toFixed(2)} ₺</span>
            </div>

            {/* Adres Seçimi */}
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-700 mb-2">Teslimat Adresi</p>

              {addresses.length > 0 && (
                <div className="space-y-1.5 mb-2">
                  {addresses.map(addr => (
                    <label key={addr.id}
                      className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition ${selectedAddressId === addr.id && !showNewAddress ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="address" checked={selectedAddressId === addr.id && !showNewAddress}
                        onChange={() => handleSelectAddress(addr.id)}
                        className="mt-0.5 accent-red-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-800">{addr.title}</p>
                        <p className="text-xs text-gray-500 truncate">{addr.address}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {/* Yeni Adres Ekle */}
              {showNewAddress ? (
                <div className="border border-red-200 rounded-lg p-3 bg-red-50 space-y-2">
                  <input value={newAddress.title} onChange={e => setNewAddress({...newAddress, title: e.target.value})}
                    placeholder="Adres başlığı (Ev, İş...)"
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-400" />
                  <textarea value={newAddress.address} onChange={e => setNewAddress({...newAddress, address: e.target.value})}
                    rows={2} placeholder="Tam adres"
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-400" />
                  <div className="flex gap-1">
                    <button onClick={handleAddNewAddress}
                      className="flex-1 bg-red-600 text-white py-1.5 rounded text-xs hover:bg-red-700 transition">
                      Kaydet ve Seç
                    </button>
                    <button onClick={() => setShowNewAddress(false)}
                      className="px-3 py-1.5 rounded text-xs text-gray-500 hover:bg-gray-100 transition">
                      İptal
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => { setShowNewAddress(true); setSelectedAddressId(null); }}
                  className="w-full text-xs text-red-600 border border-dashed border-red-300 rounded-lg py-2 hover:bg-red-50 transition">
                  + Yeni adres ekle
                </button>
              )}
            </div>

            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Not (isteğe bağlı)"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 mb-2" />

            <button onClick={placeOrder} disabled={ordering || !selectedAddress || showNewAddress}
              className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition font-medium text-sm disabled:opacity-50">
              {ordering ? 'Sipariş veriliyor...' : showNewAddress ? 'Önce adresi kaydedin' : 'Sipariş Ver'}
            </button>
          </>
        )}
      </div>
      </div>
    </div>
  );
}
