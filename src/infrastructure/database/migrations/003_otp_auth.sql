-- ══════════════════════════════════════════════════════════════════════════
-- VoltMap — Migration 003: Phone + OTP authentication
-- ══════════════════════════════════════════════════════════════════════════

-- رمز عبور دیگر برای ورود لازم نیست (nullable)
ALTER TABLE users
  MODIFY password_hash VARCHAR(255) NULL;

-- جدول کدهای یک‌بارمصرف (OTP)
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
