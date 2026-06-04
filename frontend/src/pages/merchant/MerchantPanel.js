import { useState, useEffect } from 'react';
import api from '../../services/api';
import socket from '../../services/socket';
import RestaurantSetup from './RestaurantSetup';
import MenuManager from './MenuManager';
import OrderManager from './OrderManager';
import EarningsReport from './EarningsReport';
import MerchantProfile from './MerchantProfile';
import MerchantReviews from './MerchantReviews';

export default function MerchantPanel() {
  const [restaurant, setRestaurant] = useState(undefined);
  const [tab, setTab] = useState('orders');
  const [approvalNotif, setApprovalNotif] = useState(
    () => localStorage.getItem('approval_notif') || null
  );

  const showNotif = (type) => {
    setApprovalNotif(type);
    localStorage.setItem('approval_notif', type);
  };

  const dismissNotif = () => {
    setApprovalNotif(null);
    localStorage.removeItem('approval_notif');
  };

  useEffect(() => {
    api.get('/menu/restaurant')
      .then(res => {
        const r = res.data;
        setRestaurant(r);
        if (!r) return;

        // Çevrimdışıyken onaylanan/reddedilen durumu yakala
        const lastKnownStatus = localStorage.getItem(`last_status_${r.id}`);

        if (!lastKnownStatus) {
          // İlk kez açılıyor: mevcut durumu kaydet, bildirim gösterme
          localStorage.setItem(`last_status_${r.id}`, r.approval_status);
        } else if (lastKnownStatus !== r.approval_status) {
          // Durum değişmiş — bildirim göster
          if (r.approval_status === 'approved') showNotif('approved');
          if (r.approval_status === 'rejected') showNotif('rejected');
          localStorage.setItem(`last_status_${r.id}`, r.approval_status);
        }
      })
      .catch(() => setRestaurant(null));

    socket.on('restaurant_approved', () => {
      showNotif('approved');
      api.get('/menu/restaurant').then(res => {
        setRestaurant(res.data);
        if (res.data) localStorage.setItem(`last_status_${res.data.id}`, 'approved');
      }).catch(() => {});
    });

    socket.on('restaurant_rejected', () => {
      showNotif('rejected');
      api.get('/menu/restaurant').then(res => {
        setRestaurant(res.data);
        if (res.data) localStorage.setItem(`last_status_${res.data.id}`, 'rejected');
      }).catch(() => {});
    });

    return () => {
      socket.off('restaurant_approved');
      socket.off('restaurant_rejected');
    };
  }, []);

  if (restaurant === undefined) return <div className="text-center mt-20 text-gray-500">Yükleniyor...</div>;

  if (!restaurant) return (
    <RestaurantSetup onCreated={(r) => {
      setRestaurant(r);
      localStorage.setItem(`last_status_${r.id}`, r.approval_status);
    }} />
  );

  const isPending = restaurant.approval_status === 'pending';
  const isRejected = restaurant.approval_status === 'rejected';

  const tabs = [
    { key: 'orders',   label: 'Siparişler' },
    { key: 'reviews',  label: 'Değerlendirmeler' },
    { key: 'earnings', label: 'Kazanç Raporu' },
    { key: 'menu',     label: 'Menü Yönetimi' },
    { key: 'business', label: 'İşletme Profili' },
    { key: 'profile',  label: 'Hesabım' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* Onay bildirimleri */}
      {approvalNotif === 'approved' && (
        <div className="mb-4 bg-green-500 text-white px-4 py-3 rounded-xl flex items-center justify-between">
          <span>🎉 <strong>Tebrikler!</strong> İşletmeniz onaylandı, artık müşteriler sizi görebilir.</span>
          <button onClick={dismissNotif} className="text-white opacity-70 hover:opacity-100 ml-4">✕</button>
        </div>
      )}
      {approvalNotif === 'rejected' && (
        <div className="mb-4 bg-red-500 text-white px-4 py-3 rounded-xl flex items-center justify-between">
          <span>❌ İşletme başvurunuz reddedildi. Bilgilerinizi güncelleyip tekrar başvurabilirsiniz.</span>
          <button onClick={dismissNotif} className="text-white opacity-70 hover:opacity-100 ml-4">✕</button>
        </div>
      )}

      {/* Onay bekliyor uyarısı */}
      {isPending && (
        <div className="mb-5 bg-yellow-50 border border-yellow-300 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">⏳</span>
          <div>
            <p className="font-semibold text-yellow-800 text-sm">İşletmeniz onay bekliyor</p>
            <p className="text-xs text-yellow-700">Belediye yöneticisi başvurunuzu inceledikten sonra aktif olacaksınız.</p>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="mb-5 bg-red-50 border border-red-300 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">❌</span>
          <div>
            <p className="font-semibold text-red-800 text-sm">Başvurunuz reddedildi</p>
            <p className="text-xs text-red-700">İşletme bilgilerinizi güncelleyerek tekrar başvurabilirsiniz.</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{restaurant.name}</h1>
          <p className="text-sm text-gray-500">📍 {restaurant.address}</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
          isPending ? 'bg-yellow-100 text-yellow-700' :
          isRejected ? 'bg-red-100 text-red-700' :
          restaurant.is_active ? 'bg-green-100 text-green-700' :
          'bg-gray-100 text-gray-600'
        }`}>
          {isPending ? 'Onay Bekliyor' : isRejected ? 'Reddedildi' : restaurant.is_active ? 'Aktif' : 'Pasif'}
        </span>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${tab === t.key ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'orders'   && <OrderManager restaurantId={restaurant.id} />}
      {tab === 'reviews'  && <MerchantReviews />}
      {tab === 'earnings' && <EarningsReport />}
      {tab === 'menu'     && <MenuManager restaurant={restaurant} />}
      {tab === 'business' && <RestaurantSetup existing={restaurant} onUpdated={setRestaurant} />}
      {tab === 'profile'  && <MerchantProfile />}
    </div>
  );
}
