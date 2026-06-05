-- Belediye Market - Veritabanı Şeması

-- Belediyeler (white-label yapı)
CREATE TABLE IF NOT EXISTS municipalities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#E63946',
  secondary_color VARCHAR(7) DEFAULT '#1D3557',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Kullanıcılar (4 rol: customer, merchant, courier, admin)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  municipality_id INTEGER REFERENCES municipalities(id),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'merchant', 'courier', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Kullanıcı Adresleri (çoklu adres desteği)
CREATE TABLE IF NOT EXISTS addresses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Restoranlar / İşletmeler
CREATE TABLE IF NOT EXISTS restaurants (
  id SERIAL PRIMARY KEY,
  municipality_id INTEGER REFERENCES municipalities(id),
  owner_id INTEGER REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  logo_url TEXT,
  address TEXT,
  phone VARCHAR(20),
  categories TEXT[] DEFAULT '{}',
  courier_type VARCHAR(20) DEFAULT 'own' CHECK (courier_type IN ('own', 'municipality', 'both')),
  commission_rate DECIMAL(5,2) DEFAULT 10.00,
  is_active BOOLEAN DEFAULT false,
  approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Menü Kategorileri
CREATE TABLE IF NOT EXISTS menu_categories (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER REFERENCES restaurants(id),
  name VARCHAR(100) NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- Menü Ürünleri
CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES menu_categories(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true
);

-- Siparişler
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES users(id),
  restaurant_id INTEGER REFERENCES restaurants(id),
  courier_id INTEGER REFERENCES users(id),
  status VARCHAR(30) DEFAULT 'pending' CHECK (
    status IN ('pending', 'confirmed', 'preparing', 'ready', 'on_the_way', 'delivered', 'cancelled')
  ),
  total_amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  delivery_address TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP
);

-- Sipariş Kalemleri
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  menu_item_id INTEGER REFERENCES menu_items(id),
  name VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL
);

-- Esnaf Kazanç Kayıtları
CREATE TABLE IF NOT EXISTS merchant_earnings (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER REFERENCES restaurants(id),
  order_id INTEGER REFERENCES orders(id),
  gross_amount DECIMAL(10,2) NOT NULL,
  commission DECIMAL(10,2) NOT NULL,
  net_amount DECIMAL(10,2) NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Değerlendirmeler
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) UNIQUE,
  customer_id INTEGER REFERENCES users(id),
  restaurant_id INTEGER REFERENCES restaurants(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Örnek Veri: Belediye
INSERT INTO municipalities (name, primary_color, secondary_color)
VALUES ('Denizli Büyükşehir Belediyesi', '#E63946', '#1D3557')
ON CONFLICT DO NOTHING;

-- Örnek Veri: Admin Kullanıcı (şifre: password)
INSERT INTO users (municipality_id, name, email, password, role)
VALUES (1, 'Süper Admin', 'admin@belediye.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON CONFLICT DO NOTHING;
