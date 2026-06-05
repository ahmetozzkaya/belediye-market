-- ============================================================
-- Belediye Market — Demo Seed Data
-- Tüm şifreler: 123456
-- ============================================================

-- Mevcut test isimlerini gerçekçi hale getir
UPDATE users SET name = 'Ahmet Yıldız',  email = 'ahmet.yildiz@gmail.com'  WHERE id = 3;
UPDATE users SET name = 'Mehmet Kara',   email = 'mehmet.kara@gmail.com'   WHERE id = 4;
UPDATE users SET name = 'Ayşe Nur',      email = 'aysenur@gmail.com'       WHERE id = 7;
UPDATE users SET name = 'Fatma Demir',   email = 'fatma.demir@gmail.com'   WHERE id = 9;
UPDATE users SET name = 'Kemal Arslan',  email = 'kemal.arslan@gmail.com'  WHERE id = 8;
UPDATE restaurants SET name = 'Ev Yemekleri Lezzet Durağı' WHERE id = 3;

-- ============================================================
-- Yeni Kullanıcılar (şifre: 123456)
-- ============================================================
INSERT INTO users (municipality_id, name, email, password, phone, role) VALUES
  (1, 'Zeynep Çelik',    'zeynep.celik@gmail.com',   '$2b$10$WafHbnPWMTfCvNP9P5EQGOPSPAL0nQezrc2B35d5GvgZXqt2lNJrC', '0532 111 22 33', 'customer'),
  (1, 'Emre Şahin',      'emre.sahin@gmail.com',     '$2b$10$WafHbnPWMTfCvNP9P5EQGOPSPAL0nQezrc2B35d5GvgZXqt2lNJrC', '0541 333 44 55', 'customer'),
  (1, 'Hüseyin Öztürk',  'huseyin.ozturk@gmail.com', '$2b$10$WafHbnPWMTfCvNP9P5EQGOPSPAL0nQezrc2B35d5GvgZXqt2lNJrC', '0555 777 88 99', 'customer'),
  (1, 'Elif Yılmaz',     'elif.yilmaz@gmail.com',    '$2b$10$WafHbnPWMTfCvNP9P5EQGOPSPAL0nQezrc2B35d5GvgZXqt2lNJrC', '0505 222 33 44', 'customer'),
  (1, 'Selin Aktaş',     'selin.aktas@gmail.com',    '$2b$10$WafHbnPWMTfCvNP9P5EQGOPSPAL0nQezrc2B35d5GvgZXqt2lNJrC', '0546 444 55 66', 'courier'),
  (1, 'Hasan Dönmez',    'hasan.donmez@gmail.com',   '$2b$10$WafHbnPWMTfCvNP9P5EQGOPSPAL0nQezrc2B35d5GvgZXqt2lNJrC', '0532 666 77 88', 'merchant'),
  (1, 'Reyhan Güneş',    'reyhan.gunes@gmail.com',   '$2b$10$WafHbnPWMTfCvNP9P5EQGOPSPAL0nQezrc2B35d5GvgZXqt2lNJrC', '0541 999 00 11', 'merchant')
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- Yeni Restoranlar
-- ============================================================
INSERT INTO restaurants (municipality_id, owner_id, name, description, address, phone, courier_type, categories, commission_rate, is_active, approval_status)
SELECT 1, u.id, 'Döner Ustası',
  'Denizli''nin en lezzetli döner ve dürüm çeşitleri. 30 yıllık ustalık.',
  'Çakmak Mah. Atatürk Cad. No:42, Pamukkale/Denizli',
  '0258 123 45 67',
  'municipality',
  ARRAY['Döner', 'Fast Food'],
  10.00, true, 'approved'
FROM users u WHERE u.email = 'hasan.donmez@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO restaurants (municipality_id, owner_id, name, description, address, phone, courier_type, categories, commission_rate, is_active, approval_status)
SELECT 1, u.id, 'Pide & Lahmacun Fırını',
  'Taş fırında pişen geleneksel Türk pidesi ve lahmacun. Taze malzeme garantisi.',
  'Kayıhan Mah. İnönü Cad. No:18, Merkezefendi/Denizli',
  '0258 987 65 43',
  'own',
  ARRAY['Türk Mutfağı', 'Fırın Ürünleri'],
  8.00, true, 'approved'
FROM users u WHERE u.email = 'reyhan.gunes@gmail.com'
ON CONFLICT DO NOTHING;

-- ============================================================
-- Döner Ustası Menüsü
-- ============================================================
DO $$
DECLARE
  r_id INTEGER;
  cat_doner INTEGER;
  cat_durum INTEGER;
  cat_yan INTEGER;
  cat_icecek INTEGER;
BEGIN
  SELECT id INTO r_id FROM restaurants WHERE name = 'Döner Ustası';

  INSERT INTO menu_categories (restaurant_id, name, sort_order) VALUES (r_id, 'Döner Çeşitleri', 1) RETURNING id INTO cat_doner;
  INSERT INTO menu_categories (restaurant_id, name, sort_order) VALUES (r_id, 'Dürümler', 2)        RETURNING id INTO cat_durum;
  INSERT INTO menu_categories (restaurant_id, name, sort_order) VALUES (r_id, 'Yanlar', 3)          RETURNING id INTO cat_yan;
  INSERT INTO menu_categories (restaurant_id, name, sort_order) VALUES (r_id, 'İçecekler', 4)       RETURNING id INTO cat_icecek;

  INSERT INTO menu_items (category_id, name, description, price) VALUES
    (cat_doner, 'Et Döner Porsiyon',     'Dana eti döner, pilav, salata ile',       145.00),
    (cat_doner, 'Tavuk Döner Porsiyon',  'Izgara tavuk döner, pilav, salata ile',   125.00),
    (cat_doner, 'Karışık Döner',         'Et + tavuk döner, pilav, salata ile',     155.00),
    (cat_doner, 'Döner Ekmek',           'Yarım ekmek döner',                        65.00),
    (cat_durum, 'Et Dürüm',              'İnce lavaş, dana döner, sebze',            85.00),
    (cat_durum, 'Tavuk Dürüm',           'İnce lavaş, tavuk döner, sebze',           75.00),
    (cat_durum, 'Kaşarlı Dürüm',         'Kaşar peynirli özel dürüm',                95.00),
    (cat_yan,   'Patates Kızartması',    'Çıtır patates, ketçap ile',               45.00),
    (cat_yan,   'Cacık',                 'Ev yapımı cacık',                          35.00),
    (cat_yan,   'Acı Sos',               'Ev yapımı acı sos',                        15.00),
    (cat_icecek,'Ayran',                 'Soğuk ayran 300ml',                        25.00),
    (cat_icecek,'Kola',                  'Kutu kola 330ml',                          30.00),
    (cat_icecek,'Su',                    'Şişe su 500ml',                            15.00);
END $$;

-- ============================================================
-- Pide & Lahmacun Fırını Menüsü
-- ============================================================
DO $$
DECLARE
  r_id INTEGER;
  cat_pide INTEGER;
  cat_lahm INTEGER;
  cat_corba INTEGER;
  cat_icecek INTEGER;
BEGIN
  SELECT id INTO r_id FROM restaurants WHERE name = 'Pide & Lahmacun Fırını';

  INSERT INTO menu_categories (restaurant_id, name, sort_order) VALUES (r_id, 'Pideler', 1)     RETURNING id INTO cat_pide;
  INSERT INTO menu_categories (restaurant_id, name, sort_order) VALUES (r_id, 'Lahmacun', 2)    RETURNING id INTO cat_lahm;
  INSERT INTO menu_categories (restaurant_id, name, sort_order) VALUES (r_id, 'Çorbalar', 3)    RETURNING id INTO cat_corba;
  INSERT INTO menu_categories (restaurant_id, name, sort_order) VALUES (r_id, 'İçecekler', 4)   RETURNING id INTO cat_icecek;

  INSERT INTO menu_items (category_id, name, description, price) VALUES
    (cat_pide, 'Kıymalı Pide',          'Kıyma, soğan, maydanoz, domates',         95.00),
    (cat_pide, 'Kaşarlı Pide',          'Bol kaşar peynirli pide',                  85.00),
    (cat_pide, 'Kuşbaşılı Pide',        'Dana kuşbaşı etli özel pide',             115.00),
    (cat_pide, 'Karışık Pide',          'Et + kaşar + yumurta',                    105.00),
    (cat_pide, 'Yumurtalı Sucuklu Pide','Sucuk, yumurta, kaşar',                   100.00),
    (cat_lahm, 'Lahmacun',              'İnce hamur, kıymalı, 2 adet',              65.00),
    (cat_lahm, 'Lahmacun Dürüm',        'Lahmacun dürüm, salata, limon',            75.00),
    (cat_corba,'Mercimek Çorbası',      'Günlük taze mercimek çorbası',             45.00),
    (cat_corba,'Ezogelin Çorbası',      'Geleneksel ezogelin',                      45.00),
    (cat_icecek,'Ayran',                'Soğuk ayran 300ml',                        25.00),
    (cat_icecek,'Şalgam',               'Acı şalgam suyu 300ml',                    25.00),
    (cat_icecek,'Su',                   'Şişe su 500ml',                            15.00);
END $$;

-- ============================================================
-- Gerçekçi Sipariş Geçmişi
-- ============================================================
DO $$
DECLARE
  c1 INTEGER; c2 INTEGER; c3 INTEGER; c4 INTEGER; c5 INTEGER;
  r1 INTEGER; r2 INTEGER; r3 INTEGER; r4 INTEGER; r5 INTEGER; r6 INTEGER; r7 INTEGER; r8 INTEGER; r9 INTEGER;
  k1 INTEGER; k2 INTEGER;
  i_et_doner INTEGER; i_tavuk_durum INTEGER; i_patates INTEGER; i_ayran_d INTEGER;
  i_kiyma_pide INTEGER; i_lahmacun INTEGER; i_ayran_p INTEGER;
  i_burger INTEGER; i_pizza INTEGER;
  i_kofte INTEGER; i_corba INTEGER;
  o_id INTEGER;
BEGIN
  -- Kullanıcı id'leri
  SELECT id INTO c1 FROM users WHERE email = 'aysenur@gmail.com';
  SELECT id INTO c2 FROM users WHERE email = 'fatma.demir@gmail.com';
  SELECT id INTO c3 FROM users WHERE email = 'zeynep.celik@gmail.com';
  SELECT id INTO c4 FROM users WHERE email = 'emre.sahin@gmail.com';
  SELECT id INTO c5 FROM users WHERE email = 'huseyin.ozturk@gmail.com';
  SELECT id INTO k1 FROM users WHERE email = 'kemal.arslan@gmail.com';
  SELECT id INTO k2 FROM users WHERE email = 'selin.aktas@gmail.com';

  -- Restoran id'leri
  SELECT id INTO r1 FROM restaurants WHERE name = 'Merve''nin yeri';
  SELECT id INTO r2 FROM restaurants WHERE name = 'BurAk';
  SELECT id INTO r3 FROM restaurants WHERE name = 'Ev Yemekleri Lezzet Durağı';
  SELECT id INTO r4 FROM restaurants WHERE name = 'Köfteci Dede';
  SELECT id INTO r5 FROM restaurants WHERE name = 'Pizza Burada';
  SELECT id INTO r6 FROM restaurants WHERE name = 'Kuyu Çay';
  SELECT id INTO r7 FROM restaurants WHERE name = 'Tatlıya Gel';
  SELECT id INTO r8 FROM restaurants WHERE name = 'Döner Ustası';
  SELECT id INTO r9 FROM restaurants WHERE name = 'Pide & Lahmacun Fırını';

  -- Menü item id'leri
  SELECT i.id INTO i_et_doner    FROM menu_items i JOIN menu_categories c ON i.category_id = c.id WHERE c.restaurant_id = r8 AND i.name = 'Et Döner Porsiyon';
  SELECT i.id INTO i_tavuk_durum FROM menu_items i JOIN menu_categories c ON i.category_id = c.id WHERE c.restaurant_id = r8 AND i.name = 'Tavuk Dürüm';
  SELECT i.id INTO i_patates     FROM menu_items i JOIN menu_categories c ON i.category_id = c.id WHERE c.restaurant_id = r8 AND i.name = 'Patates Kızartması';
  SELECT i.id INTO i_ayran_d     FROM menu_items i JOIN menu_categories c ON i.category_id = c.id WHERE c.restaurant_id = r8 AND i.name = 'Ayran';
  SELECT i.id INTO i_kiyma_pide  FROM menu_items i JOIN menu_categories c ON i.category_id = c.id WHERE c.restaurant_id = r9 AND i.name = 'Kıymalı Pide';
  SELECT i.id INTO i_lahmacun    FROM menu_items i JOIN menu_categories c ON i.category_id = c.id WHERE c.restaurant_id = r9 AND i.name = 'Lahmacun';
  SELECT i.id INTO i_ayran_p     FROM menu_items i JOIN menu_categories c ON i.category_id = c.id WHERE c.restaurant_id = r9 AND i.name = 'Ayran';

  -- ── Teslim edilmiş siparişler (geçmiş verisi) ──────────────────

  -- Zeynep → Döner Ustası (3 gün önce)
  INSERT INTO orders (customer_id, restaurant_id, courier_id, status, total_amount, commission_rate, delivery_address, created_at, delivered_at)
  VALUES (c3, r8, k1, 'delivered', 255.00, 10.00, 'Çakmak Mah. 1234 Sk. No:5, Pamukkale', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '45 minutes')
  RETURNING id INTO o_id;
  INSERT INTO order_items (order_id, menu_item_id, name, quantity, unit_price) VALUES
    (o_id, i_et_doner, 'Et Döner Porsiyon', 1, 145.00),
    (o_id, i_patates,  'Patates Kızartması', 1, 45.00),
    (o_id, i_ayran_d,  'Ayran', 1, 25.00);
  INSERT INTO merchant_earnings (restaurant_id, order_id, gross_amount, commission, net_amount, is_paid)
  VALUES (r8, o_id, 255.00, 25.50, 229.50, true);

  -- Emre → Pide Fırını (2 gün önce)
  INSERT INTO orders (customer_id, restaurant_id, status, total_amount, commission_rate, delivery_address, created_at, delivered_at)
  VALUES (c4, r9, 'delivered', 185.00, 8.00, 'Kayıhan Mah. 567 Cad. No:12, Merkezefendi', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '35 minutes')
  RETURNING id INTO o_id;
  INSERT INTO order_items (order_id, menu_item_id, name, quantity, unit_price) VALUES
    (o_id, i_kiyma_pide, 'Kıymalı Pide',  2, 95.00),
    (o_id, i_lahmacun,   'Lahmacun',       1, 65.00);
  INSERT INTO merchant_earnings (restaurant_id, order_id, gross_amount, commission, net_amount, is_paid)
  VALUES (r9, o_id, 185.00, 14.80, 170.20, true);

  -- Hüseyin → BurAk (2 gün önce)
  SELECT i.id INTO i_burger FROM menu_items i JOIN menu_categories c ON i.category_id = c.id
  WHERE c.restaurant_id = r2 ORDER BY i.price DESC LIMIT 1;
  INSERT INTO orders (customer_id, restaurant_id, courier_id, status, total_amount, commission_rate, delivery_address, created_at, delivered_at)
  VALUES (c5, r2, k2, 'delivered', 320.00, 10.00, 'Sümer Mah. 890 Sk. No:3, Merkezefendi', NOW() - INTERVAL '2 days' + INTERVAL '3 hours', NOW() - INTERVAL '2 days' + INTERVAL '4 hours')
  RETURNING id INTO o_id;
  INSERT INTO order_items (order_id, menu_item_id, name, quantity, unit_price) VALUES
    (o_id, i_burger, 'Burger', 2, 160.00);
  INSERT INTO merchant_earnings (restaurant_id, order_id, gross_amount, commission, net_amount, is_paid)
  VALUES (r2, o_id, 320.00, 32.00, 288.00, true);

  -- Ayşe → Köfteci Dede (dün)
  SELECT i.id INTO i_kofte FROM menu_items i JOIN menu_categories c ON i.category_id = c.id
  WHERE c.restaurant_id = r4 AND c.name = 'Köfte Çeşitleri' LIMIT 1;
  SELECT i.id INTO i_corba FROM menu_items i JOIN menu_categories c ON i.category_id = c.id
  WHERE c.restaurant_id = r4 AND c.name = 'Çorbalar' LIMIT 1;
  INSERT INTO orders (customer_id, restaurant_id, courier_id, status, total_amount, commission_rate, delivery_address, created_at, delivered_at)
  VALUES (c1, r4, k1, 'delivered', 310.00, 10.00, 'Çakmak Mah. 321 Sk. No:8, Pamukkale', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '40 minutes')
  RETURNING id INTO o_id;
  INSERT INTO order_items (order_id, menu_item_id, name, quantity, unit_price) VALUES
    (o_id, i_kofte, 'Köfte', 2, 120.00),
    (o_id, i_corba, 'Çorba', 2, 45.00);
  INSERT INTO merchant_earnings (restaurant_id, order_id, gross_amount, commission, net_amount, is_paid)
  VALUES (r4, o_id, 310.00, 31.00, 279.00, false);

  -- Fatma → Döner Ustası (dün)
  INSERT INTO orders (customer_id, restaurant_id, courier_id, status, total_amount, commission_rate, delivery_address, created_at, delivered_at)
  VALUES (c2, r8, k2, 'delivered', 235.00, 10.00, 'Bağbaşı Mah. 654 Cad. No:22, Pamukkale', NOW() - INTERVAL '1 day' + INTERVAL '2 hours', NOW() - INTERVAL '1 day' + INTERVAL '3 hours')
  RETURNING id INTO o_id;
  INSERT INTO order_items (order_id, menu_item_id, name, quantity, unit_price) VALUES
    (o_id, i_tavuk_durum, 'Tavuk Dürüm',       2, 75.00),
    (o_id, i_patates,     'Patates Kızartması', 1, 45.00),
    (o_id, i_ayran_d,     'Ayran',              2, 25.00);
  INSERT INTO merchant_earnings (restaurant_id, order_id, gross_amount, commission, net_amount, is_paid)
  VALUES (r8, o_id, 235.00, 23.50, 211.50, false);

  -- Zeynep → Pizza Burada (dün akşam)
  SELECT i.id INTO i_pizza FROM menu_items i JOIN menu_categories c ON i.category_id = c.id
  WHERE c.restaurant_id = r5 AND c.name = 'Pizzalar' LIMIT 1;
  INSERT INTO orders (customer_id, restaurant_id, status, total_amount, commission_rate, delivery_address, created_at, delivered_at)
  VALUES (c3, r5, 'delivered', 390.00, 10.00, 'Çakmak Mah. 1234 Sk. No:5, Pamukkale', NOW() - INTERVAL '20 hours', NOW() - INTERVAL '20 hours' + INTERVAL '50 minutes')
  RETURNING id INTO o_id;
  INSERT INTO order_items (order_id, menu_item_id, name, quantity, unit_price) VALUES
    (o_id, i_pizza, 'Pizza', 2, 195.00);
  INSERT INTO merchant_earnings (restaurant_id, order_id, gross_amount, commission, net_amount, is_paid)
  VALUES (r5, o_id, 390.00, 39.00, 351.00, false);

  -- Emre → Pide Fırını (bugün sabah)
  INSERT INTO orders (customer_id, restaurant_id, status, total_amount, commission_rate, delivery_address, created_at, delivered_at)
  VALUES (c4, r9, 'delivered', 160.00, 8.00, 'Kayıhan Mah. 567 Cad. No:12, Merkezefendi', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '3 hours')
  RETURNING id INTO o_id;
  INSERT INTO order_items (order_id, menu_item_id, name, quantity, unit_price) VALUES
    (o_id, i_kiyma_pide, 'Kıymalı Pide',  1, 95.00),
    (o_id, i_lahmacun,   'Lahmacun',       1, 65.00);
  INSERT INTO merchant_earnings (restaurant_id, order_id, gross_amount, commission, net_amount, is_paid)
  VALUES (r9, o_id, 160.00, 12.80, 147.20, false);

  -- ── Aktif siparişler (demo için) ─────────────────────────────

  -- Hüseyin → Döner Ustası (şu an hazırlanıyor)
  INSERT INTO orders (customer_id, restaurant_id, status, total_amount, commission_rate, delivery_address, notes, created_at)
  VALUES (c5, r8, 'preparing', 215.00, 10.00, 'Sümer Mah. 890 Sk. No:3, Merkezefendi', 'Az acılı olsun lütfen', NOW() - INTERVAL '15 minutes')
  RETURNING id INTO o_id;
  INSERT INTO order_items (order_id, menu_item_id, name, quantity, unit_price) VALUES
    (o_id, i_et_doner,  'Et Döner Porsiyon', 1, 145.00),
    (o_id, i_patates,   'Patates Kızartması',1, 45.00),
    (o_id, i_ayran_d,   'Ayran',             1, 25.00);
  INSERT INTO merchant_earnings (restaurant_id, order_id, gross_amount, commission, net_amount)
  VALUES (r8, o_id, 215.00, 21.50, 193.50);

  -- Ayşe → Pide Fırını (bekliyor)
  INSERT INTO orders (customer_id, restaurant_id, status, total_amount, commission_rate, delivery_address, created_at)
  VALUES (c1, r9, 'pending', 255.00, 8.00, 'Çakmak Mah. 321 Sk. No:8, Pamukkale', NOW() - INTERVAL '3 minutes')
  RETURNING id INTO o_id;
  INSERT INTO order_items (order_id, menu_item_id, name, quantity, unit_price) VALUES
    (o_id, i_kiyma_pide, 'Kıymalı Pide',   2, 95.00),
    (o_id, i_ayran_p,    'Ayran',            2, 25.00);
  INSERT INTO merchant_earnings (restaurant_id, order_id, gross_amount, commission, net_amount)
  VALUES (r9, o_id, 255.00, 20.40, 234.60);

  -- ── İptal edilmiş siparişler ──────────────────────────────────

  INSERT INTO orders (customer_id, restaurant_id, status, total_amount, commission_rate, delivery_address, created_at)
  VALUES (c3, r2, 'cancelled', 280.00, 10.00, 'Çakmak Mah. 1234 Sk. No:5, Pamukkale', NOW() - INTERVAL '5 hours')
  RETURNING id INTO o_id;
  INSERT INTO order_items (order_id, menu_item_id, name, quantity, unit_price)
  VALUES (o_id, i_burger, 'Burger', 2, 140.00);

END $$;

-- ============================================================
-- Değerlendirmeler
-- ============================================================
DO $$
DECLARE
  c3 INTEGER; c4 INTEGER; c5 INTEGER;
  r8 INTEGER; r9 INTEGER; r2 INTEGER; r4 INTEGER;
  o1 INTEGER; o2 INTEGER; o3 INTEGER; o4 INTEGER;
BEGIN
  SELECT id INTO c3 FROM users WHERE email = 'zeynep.celik@gmail.com';
  SELECT id INTO c4 FROM users WHERE email = 'emre.sahin@gmail.com';
  SELECT id INTO c5 FROM users WHERE email = 'huseyin.ozturk@gmail.com';
  SELECT id INTO r8 FROM restaurants WHERE name = 'Döner Ustası';
  SELECT id INTO r9 FROM restaurants WHERE name = 'Pide & Lahmacun Fırını';
  SELECT id INTO r2 FROM restaurants WHERE name = 'BurAk';
  SELECT id INTO r4 FROM restaurants WHERE name = 'Köfteci Dede';

  -- En eski teslim edilmiş siparişleri bul
  SELECT id INTO o1 FROM orders WHERE customer_id = c3 AND restaurant_id = r8 AND status = 'delivered' ORDER BY created_at LIMIT 1;
  SELECT id INTO o2 FROM orders WHERE customer_id = c4 AND restaurant_id = r9 AND status = 'delivered' ORDER BY created_at LIMIT 1;
  SELECT id INTO o3 FROM orders WHERE customer_id = c5 AND restaurant_id = r2 AND status = 'delivered' LIMIT 1;
  SELECT id INTO o4 FROM orders WHERE customer_id = c3 AND restaurant_id = r9 AND status = 'delivered' LIMIT 1;

  INSERT INTO reviews (order_id, customer_id, restaurant_id, rating, comment) VALUES
    (o1, c3, r8, 5, 'Et döner muhteşemdi! Porsiyon çok doluydu, hızlı geldi. Kesinlikle tavsiye ederim.'),
    (o2, c4, r9, 5, 'Harika bir pide fırını. Kıymalı pide taş fırın lezzetindeydi, lahmacun da enfes.'),
    (o3, c5, r2, 4, 'Burger güzeldi, patates de güzel kızarmış. Biraz geç geldi ama değdi.')
  ON CONFLICT DO NOTHING;

  IF o4 IS NOT NULL THEN
    INSERT INTO reviews (order_id, customer_id, restaurant_id, rating, comment)
    VALUES (o4, c3, r9, 5, 'Pide fırınına bir daha sipariş verdim, yine hayal kırıklığı yaşamadım!')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
