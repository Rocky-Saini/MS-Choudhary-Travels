import "dotenv/config";
import pg from "pg";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query('ALTER TABLE "Trip" ADD COLUMN IF NOT EXISTS "tag" TEXT');
  console.log("✅ tag column added to Trip");
  await pool.end();
}

main();
