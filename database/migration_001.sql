-- Migration 001: Eksik kolon ve index düzeltmeleri
-- Tarih: 2026-06-05

-- restaurants.categories kolonu eksikti; kod bu kolonu kullanıyor
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';

-- Performans için index'ler
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_courier_id ON orders(courier_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_categories_restaurant_id ON menu_categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant_id ON reviews(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_earnings_restaurant_id ON merchant_earnings(restaurant_id);
