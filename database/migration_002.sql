-- Migration 002: Şifre sıfırlama token'ları + Restoran çalışma saatleri

ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;

CREATE TABLE IF NOT EXISTS restaurant_hours (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time TIME NOT NULL DEFAULT '09:00',
  close_time TIME NOT NULL DEFAULT '22:00',
  is_closed BOOLEAN DEFAULT false,
  UNIQUE(restaurant_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_restaurant_hours_restaurant_id ON restaurant_hours(restaurant_id);

-- Mevcut restoranlar için varsayılan saatler (0=Pazar, 1=Pzt...6=Cmt)
INSERT INTO restaurant_hours (restaurant_id, day_of_week, open_time, close_time, is_closed)
SELECT
  r.id,
  d.day,
  CASE WHEN d.day = 0 THEN '10:00'::TIME ELSE '09:00'::TIME END,
  CASE WHEN d.day = 0 THEN '21:00'::TIME ELSE '22:00'::TIME END,
  false
FROM restaurants r
CROSS JOIN (SELECT generate_series(0, 6) AS day) d
ON CONFLICT (restaurant_id, day_of_week) DO NOTHING;
