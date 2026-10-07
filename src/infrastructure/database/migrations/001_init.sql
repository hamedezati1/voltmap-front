-- ══════════════════════════════════════════════════════════════════════════
-- VoltMap — Migration 001: Initial schema (MySQL / MariaDB)
-- ══════════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════════════
-- users
-- ══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS users (
  id             CHAR(36) PRIMARY KEY,
  name           VARCHAR(255) NOT NULL,
  email          VARCHAR(255) NULL,
  phone          VARCHAR(11) NOT NULL,
  password_hash  VARCHAR(255) NULL,
  role           VARCHAR(16) NOT NULL DEFAULT 'user',
  membership     VARCHAR(64) NOT NULL DEFAULT 'رایگان',
  total_sessions INT NOT NULL DEFAULT 0,
  total_kwh      DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at     DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at     DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT users_email_unique UNIQUE (email),
  CONSTRAINT users_phone_unique UNIQUE (phone),
  CONSTRAINT users_role_check CHECK (role IN ('user','admin'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

-- ══════════════════════════════════════════════════════════════════════════
-- refresh_tokens
-- ══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          CHAR(36) PRIMARY KEY,
  user_id     CHAR(36) NOT NULL,
  token_hash  VARCHAR(255) NOT NULL,
  expires_at  DATETIME(6) NOT NULL,
  revoked_at  DATETIME(6) NULL,
  created_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT refresh_tokens_token_unique UNIQUE (token_hash),
  CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

-- ══════════════════════════════════════════════════════════════════════════
-- otp_codes (ورود / ثبت‌نام با پیامک)
-- ══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS otp_codes (
  id           CHAR(36) PRIMARY KEY,
  phone        VARCHAR(11) NOT NULL,
  code_hash    VARCHAR(255) NOT NULL,
  purpose      VARCHAR(16) NOT NULL DEFAULT 'login',
  attempts     INT NOT NULL DEFAULT 0,
  expires_at   DATETIME(6) NOT NULL,
  consumed_at  DATETIME(6) NULL,
  created_at   DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT otp_purpose_check CHECK (purpose IN ('login', 'register')),
  INDEX idx_otp_phone_created (phone, created_at),
  INDEX idx_otp_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

-- ══════════════════════════════════════════════════════════════════════════
-- stations
-- ══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS stations (
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

-- ══════════════════════════════════════════════════════════════════════════
-- station_reviews
-- (بازمحاسبه‌ی rating ایستگاه در لایه‌ی Repository انجام می‌شود)
-- ══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS station_reviews (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  station_id  INT NOT NULL,
  user_id     CHAR(36) NULL,
  user_name   VARCHAR(255) NOT NULL,
  text        TEXT NOT NULL,
  rating      SMALLINT NOT NULL,
  created_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT reviews_rating_check CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_reviews_station FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

CREATE INDEX idx_reviews_station ON station_reviews(station_id);

-- ══════════════════════════════════════════════════════════════════════════
-- station_crowd_reports
-- ══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS station_crowd_reports (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  station_id  INT NOT NULL,
  user_id     CHAR(36) NULL,
  type        VARCHAR(16) NOT NULL,
  created_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT crowd_type_check CHECK (type IN ('available','busy')),
  CONSTRAINT fk_crowd_station FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
  CONSTRAINT fk_crowd_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

CREATE INDEX idx_crowd_station_time ON station_crowd_reports(station_id, created_at);

-- ══════════════════════════════════════════════════════════════════════════
-- user_favorites
-- ══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS user_favorites (
  user_id     CHAR(36) NOT NULL,
  station_id  INT NOT NULL,
  created_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (user_id, station_id),
  CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_favorites_station FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

-- ══════════════════════════════════════════════════════════════════════════
-- vehicles
-- یک خودروی پیش‌فرض به‌ازای هر کاربر در لایه‌ی سرویس (clearDefault) تضمین می‌شود
-- ══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS vehicles (
  id               CHAR(36) PRIMARY KEY,
  user_id          CHAR(36) NOT NULL,
  name             VARCHAR(255) NOT NULL,
  image            TEXT NULL,
  battery_level    SMALLINT NULL,
  estimated_range  INT NULL,
  connector        VARCHAR(64) NOT NULL,
  year             INT NULL,
  is_default       TINYINT(1) NOT NULL DEFAULT 0,
  created_at       DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at       DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT vehicles_battery_check CHECK (battery_level IS NULL OR (battery_level BETWEEN 0 AND 100)),
  CONSTRAINT fk_vehicles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

CREATE INDEX idx_vehicles_user ON vehicles(user_id);

-- ══════════════════════════════════════════════════════════════════════════
-- news
-- ══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS news (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(512) NOT NULL,
  body          TEXT NOT NULL,
  image         TEXT NULL,
  category      VARCHAR(128) NULL,
  pinned        TINYINT(1) NOT NULL DEFAULT 0,
  published_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_at    DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at    DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

-- ══════════════════════════════════════════════════════════════════════════
-- station_reports
-- ══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS station_reports (
  id             CHAR(36) PRIMARY KEY,
  user_id        CHAR(36) NULL,
  name           VARCHAR(255) NOT NULL,
  city           VARCHAR(128) NULL,
  address        TEXT NULL,
  lat            DOUBLE NULL,
  lng            DOUBLE NULL,
  type           VARCHAR(16) NULL,
  connector      VARCHAR(64) NULL,
  notes          TEXT NULL,
  status         VARCHAR(16) NOT NULL DEFAULT 'pending',
  reject_reason  TEXT NULL,
  created_at     DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at     DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT station_reports_status_check CHECK (status IN ('pending','approved','rejected')),
  CONSTRAINT fk_station_reports_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

CREATE INDEX idx_station_reports_status ON station_reports(status);

-- ══════════════════════════════════════════════════════════════════════════
-- route_history
-- ══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS route_history (
  id               CHAR(36) PRIMARY KEY,
  user_id          CHAR(36) NOT NULL,
  origin           JSON NOT NULL,
  destination      JSON NOT NULL,
  vehicle_range    INT NULL,
  connector_type   VARCHAR(64) NULL,
  total_distance   DECIMAL(8,2) NULL,
  total_duration   INT NULL,
  charging_stops   JSON NOT NULL,
  created_at       DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_route_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

CREATE INDEX idx_route_history_user ON route_history(user_id);
