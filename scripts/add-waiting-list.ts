import "dotenv/config";
import pg from "pg";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "WaitingList" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "customerName" TEXT NOT NULL,
      "customerMobile" TEXT NOT NULL,
      "routeId" TEXT NOT NULL,
      "date" TIMESTAMP(3) NOT NULL,
      "pickupPoint" TEXT NOT NULL,
      "dropPoint" TEXT NOT NULL,
      "seats" INTEGER NOT NULL DEFAULT 1,
      "status" TEXT NOT NULL DEFAULT 'WAITING',
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "WaitingList_pkey" PRIMARY KEY ("id")
    );
  `);
  console.log("✅ WaitingList table created");
  await pool.end();
}

main();
