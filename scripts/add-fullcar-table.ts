import "dotenv/config";
import pg from "pg";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "FullCarBooking" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "customerName" TEXT NOT NULL,
      "customerMobile" TEXT NOT NULL,
      "pickupPoint" TEXT NOT NULL,
      "dropPoint" TEXT NOT NULL,
      "date" TIMESTAMP(3) NOT NULL,
      "preferredTime" TEXT,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "tripId" TEXT,
      "adminNotes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "FullCarBooking_pkey" PRIMARY KEY ("id")
    );
  `);
  console.log("✅ FullCarBooking table created");
  await pool.end();
}
main();
