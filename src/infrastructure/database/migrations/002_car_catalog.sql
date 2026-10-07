-- ══════════════════════════════════════════════════════════════════════════
-- VoltMap — Migration 002: کاتالوگ خودروهای برقی ایران
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS car_catalog (
  id            INT PRIMARY KEY,
  brand         VARCHAR(128) NOT NULL,
  model         VARCHAR(128) NOT NULL,
  trim          VARCHAR(128) NULL,
  body_type     VARCHAR(32) NOT NULL,
  battery_kwh   VARCHAR(64) NOT NULL,
  range_km      VARCHAR(64) NOT NULL,
  connector     VARCHAR(64) NOT NULL,
  max_dc_kw     VARCHAR(64) NOT NULL,
  created_at    DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT car_catalog_body_type_check CHECK (body_type IN ('SEDAN','SUV','HATCHBACK'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_car_catalog_brand ON car_catalog(brand);
CREATE INDEX idx_car_catalog_body_type ON car_catalog(body_type);
CREATE INDEX idx_car_catalog_connector ON car_catalog(connector);
