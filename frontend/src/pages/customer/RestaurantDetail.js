import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function RestaurantDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [cart, setCart] = useState([]);
  const [address, setAddress] = useState(user?.address || '');
  const [notes, setNotes] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get(`/restaurants/${id}`).then(res => setRestaurant(res.data)).catch(console.error);
  }, [id]);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.menu_item_id === item.id);
      if (existing) return prev.map(i => i.menu_item_id === item.id ? {...i, quantity: i.quantity + 1} : i);
      return [...prev, { menu_item_id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.menu_item_id !== id));

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const placeOrder = async () => {
    if (!user) return navigate('/login');
    if (!address) return alert('Lütfen teslimat adresinizi girin');
    setOrdering(true);
    try {
      await api.post('/orders', {
        restaurant_id: parseInt(id),
        items: cart.map(i => ({ menu_item_id: i.menu_item_id, quantity: i.quantity })),
        delivery_address: address,
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
    <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">{restaurant.name}</h1>
        <p className="text-gray-500 mb-6">📍 {restaurant.address}</p>
        {restaurant.menu?.map(cat => (
          <div key={cat.id} className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-1">{cat.name}</h3>
            <div className="space-y-2">
              {cat.items?.filter(i => i.id).map(item => (
                <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                  <div>
                    <p className="font-medium text-gray-800">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-red-600">{parseFloat(item.price).toFixed(2)} ₺</span>
                    {item.is_available ? (
                      <button onClick={() => addToCart(item)}
                        className="bg-red-600 text-white w-8 h-8 rounded-full hover:bg-red-700 transition text-lg font-bold">+</button>
                    ) : (
                      <span className="text-xs text-gray-400">Mevcut değil</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow p-4 h-fit sticky top-4">
        <h3 className="font-bold text-gray-800 mb-3">Sepet</h3>
        {cart.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">Sepetiniz boş</p>
        ) : (
          <>
            {cart.map(i => (
              <div key={i.menu_item_id} className="flex items-center justify-between text-sm mb-2">
                <span>{i.name} x{i.quantity}</span>
                <div className="flex items-center gap-2">
                  <span className="text-red-600 font-medium">{(i.price * i.quantity).toFixed(2)} ₺</span>
                  <button onClick={() => removeFromCart(i.menu_item_id)} className="text-gray-400 hover:text-red-500 text-xs">✕</button>
                </div>
              </div>
            ))}
            <div className="border-t pt-2 mt-2 font-semibold flex justify-between">
              <span>Toplam</span>
              <span className="text-red-600">{total.toFixed(2)} ₺</span>
            </div>
            <div className="mt-3 space-y-2">
              <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Teslimat adresi *"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Not (isteğe bağlı)"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
              <button onClick={placeOrder} disabled={ordering}
                className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition font-medium text-sm disabled:opacity-50">
                {ordering ? 'Sipariş veriliyor...' : 'Sipariş Ver'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
