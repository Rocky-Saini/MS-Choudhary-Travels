import "dotenv/config";
import pg from "pg";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query('ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "feeCollected" BOOLEAN NOT NULL DEFAULT false');
  await pool.query('ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "paymentMode" TEXT');
  console.log("✅ feeCollected & paymentMode columns added to Booking");
  await pool.end();
}

main();
