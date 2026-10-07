-- ══════════════════════════════════════════════════════════════════════════
-- VoltMap — Migration 004: stations schema aligned with Excel catalog
-- ══════════════════════════════════════════════════════════════════════════

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS stations;

CREATE TABLE stations (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  code            VARCHAR(32) NOT NULL,
  name            VARCHAR(255) NOT NULL,
  operator        VARCHAR(128) NULL,
  province        VARCHAR(128) NULL,
  city            VARCHAR(128) NOT NULL,
  district        VARCHAR(128) NULL,
  address         TEXT NOT NULL,
  lat             DOUBLE NULL,
  lng             DOUBLE NULL,
  ac_ports        INT NOT NULL DEFAULT 0,
  dc_ports        INT NOT NULL DEFAULT 0,
  max_power       VARCHAR(128) NULL,
  connectors      VARCHAR(255) NULL,
  parking_spots   VARCHAR(64) NULL,
  is_free         TINYINT(1) NOT NULL DEFAULT 0,
  price_per_kwh   VARCHAR(64) NULL,
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  is_verified     TINYINT(1) NOT NULL DEFAULT 0,
  hours           VARCHAR(255) NULL,
  phone           VARCHAR(64) NULL,
  image1          TEXT NULL,
  image2          TEXT NULL,
  image3          TEXT NULL,
  description     TEXT NULL,
  data_updated_at DATE NULL,
  status          VARCHAR(32) NOT NULL DEFAULT 'available',
  rating          DECIMAL(2,1) NOT NULL DEFAULT 0,
  created_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT stations_code_unique UNIQUE (code),
  CONSTRAINT stations_status_check CHECK (status IN ('available','busy','waiting','offline'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

CREATE INDEX idx_stations_city ON stations(city);
CREATE INDEX idx_stations_province ON stations(province);
CREATE INDEX idx_stations_status ON stations(status);
CREATE INDEX idx_stations_operator ON stations(operator);
CREATE INDEX idx_stations_is_active ON stations(is_active);

-- پاک‌سازی داده‌های وابستهٔ ایستگاه‌های حذف‌شده
DELETE FROM station_reviews;
DELETE FROM station_crowd_reports;
DELETE FROM user_favorites;

SET FOREIGN_KEY_CHECKS = 1;
