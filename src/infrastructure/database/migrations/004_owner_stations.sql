-- ایستگاه‌هایی که کاربر ثبت کرده و ادمین تأیید کرده، روی نقشه جدا دیده می‌شوند.
ALTER TABLE stations
  ADD COLUMN is_owner_station TINYINT(1) NOT NULL DEFAULT 0 AFTER is_verified;
