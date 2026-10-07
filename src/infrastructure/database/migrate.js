/**
 * اجراکننده‌ی ساده‌ی migration ها.
 * فایل‌های .sql داخل پوشه‌ی migrations/ رو به ترتیب نام اجرا می‌کنه
 * و هر کدوم رو داخل یک تراکنش (تا حد امکان) اجرا می‌کنه.
 * جدول schema_migrations نگه می‌داره کدوم فایل‌ها قبلاً اجرا شدن.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool, closePool } from "./pool.js";
import { logger } from "../logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, "migrations");

async function ensureMigrationsTable(client) {
  await client.queryRaw(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename    VARCHAR(255) PRIMARY KEY,
      applied_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci
  `);
}

async function getAppliedMigrations(client) {
  const { rows } = await client.query("SELECT filename FROM schema_migrations");
  return new Set(rows.map((r) => r.filename));
}

async function run() {
  const client = await pool.getConnection();
  try {
    await ensureMigrationsTable(client);
    const applied = await getAppliedMigrations(client);

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      if (applied.has(file)) {
        logger.info(`⏭  رد شد (قبلاً اجرا شده): ${file}`);
        continue;
      }
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
      logger.info(`▶️  در حال اجرا: ${file}`);
      try {
        await client.beginTransaction();
        // DDL ممکن است implicit commit کند؛ همچنان record را بعد از موفقیت ثبت می‌کنیم
        await client.queryRaw(sql);
        await client.query(
          "INSERT INTO schema_migrations(filename) VALUES (?)",
          [file],
        );
        await client.commit();
        logger.info(`✅ اجرا شد: ${file}`);
      } catch (err) {
        try {
          await client.rollback();
        } catch {
          /* ignore */
        }
        throw new Error(`Migration failed on ${file}: ${err.message}`);
      }
    }
    logger.info("🎉 همه‌ی migration ها با موفقیت اجرا شدند");
  } finally {
    client.release();
    await closePool();
  }
}

run().catch((err) => {
  logger.error("Migration runner failed", { error: err.message });
  process.exit(1);
});
