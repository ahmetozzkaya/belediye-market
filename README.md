# Belediye Market

Belediyelere satılacak, esnaf ve vatandaşı buluşturan yerel yemek sipariş platformu.

## Proje Hakkında

Getir, Yemeksepeti gibi büyük pazaryerlerine alternatif olarak geliştirilmiş, **white-label** yapıda bir yemek sipariş uygulamasıdır. Her belediye kendi logosu ve renkleriyle kullanabilir.

### Neden Bu Proje?

| Taraf | Kazanç |
|---|---|
| **Biz** | Uygulamayı belediyelere satarak gelir |
| **Belediye** | Halka hizmet, istihdam (kurye), seçim vaadi |
| **Esnaf** | Büyük platformlara yüksek komisyon ödemek yerine daha çok kazanç |
| **Halk** | Gıda ve eve servis ürünlere daha ucuz ulaşım |

---

## Teknoloji Stack

- **Frontend:** React + Tailwind CSS
- **Backend:** Node.js + Express
- **Veritabanı:** PostgreSQL
- **Kimlik Doğrulama:** JWT (JSON Web Token)

---

## Kullanıcı Rolleri

Uygulama 4 farklı panel içerir:

- **Müşteri** — Restoranları listele, menüye bak, sepete ekle, sipariş ver, siparişini takip et
- **Esnaf** — İşletme profili oluştur, menü/kategori/ürün yönet, siparişleri yönet, kurye tercihi seç
- **Kurye** — Atanan siparişleri gör, teslimat durumunu güncelle
- **Süper Admin** — Tüm kullanıcı ve işletmeleri yönet, istatistikleri gör, belediye logo/renk ayarla

---

## Kurulum

### Gereksinimler

- Node.js (v16+)
- PostgreSQL (v14+)

### 1. Repoyu klonla

```bash
git clone https://github.com/ahmetozzkaya/belediye-market.git
cd belediye-market
```

### 2. Veritabanını kur

```bash
psql postgres -c "CREATE DATABASE belediye_market;"
psql belediye_market -f database/schema.sql
```

### 3. Backend

```bash
cd backend
npm install
```

`.env` dosyası oluştur:

```env
PORT=5001
JWT_SECRET=gizli_anahtar_buraya
DB_HOST=localhost
DB_PORT=5432
DB_NAME=belediye_market
DB_USER=kullanici_adi
DB_PASSWORD=
```

```bash
npm run dev
```

### 4. Frontend

```bash
cd frontend
npm install
npm start
```

Uygulama `http://localhost:3000` adresinde açılır.

---

## Varsayılan Giriş

```
Email:  admin@belediye.com
Şifre:  password
Rol:    Süper Admin
```

---

## Proje Yapısı

```
belediye-market/
├── backend/
│   ├── config/         PostgreSQL bağlantısı
│   ├── controllers/    İş mantığı (auth, order, menu, admin)
│   ├── middleware/     JWT doğrulama
│   ├── routes/         API endpoint'leri
│   └── server.js
├── frontend/
│   └── src/
│       ├── components/ Navbar
│       ├── context/    Auth yönetimi
│       ├── pages/
│       │   ├── customer/   Ana sayfa, restoran detay, siparişlerim
│       │   ├── merchant/   İşletme profili, menü, sipariş yönetimi
│       │   ├── courier/    Teslimat paneli
│       │   └── admin/      Yönetim paneli
│       └── services/   API bağlantısı
└── database/
    └── schema.sql      Tüm tablolar ve örnek veriler
```

---

## Deployment Planı

| Aşama | Ortam | Maliyet |
|---|---|---|
| Geliştirme | Localhost | Ücretsiz |
| Demo | Railway.app | Ücretsiz |
| Production | Hetzner VPS + Nginx | ~10$/ay |
| Kurumsal | Docker (belediye sunucusu) | Belediye öder |

---

## Yol Haritası

- [x] Kullanıcı kayıt/giriş (4 rol)
- [x] Restoran listeleme ve menü
- [x] Sepet ve sipariş verme
- [x] Esnaf sipariş yönetimi
- [x] Kurye teslimat paneli
- [x] Süper admin paneli
- [x] White-label belediye ayarları
- [ ] Ödeme entegrasyonu (iyzico / PayTR)
- [ ] Gerçek zamanlı sipariş takibi (Socket.io)
- [ ] Mobil uygulama (React Native)
- [ ] Kurye atama sistemi
- [ ] Esnaf kazanç raporları
