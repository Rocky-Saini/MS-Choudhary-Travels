import "dotenv/config";
import pg from "pg";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query('ALTER TABLE "WaitingList" ADD COLUMN IF NOT EXISTS "preferredTime" TEXT');
  console.log("✅ preferredTime column added to WaitingList");
  await pool.end();
}

main();
