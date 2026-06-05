import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  
  const sql = `
    CREATE TABLE IF NOT EXISTS "BusService" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "name" TEXT NOT NULL DEFAULT 'Travel Bus',
      "routeFrom" TEXT NOT NULL,
      "routeTo" TEXT NOT NULL,
      "departureTime" TEXT NOT NULL,
      "contactNumber" TEXT,
      "fare" TEXT,
      "description" TEXT,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "BusService_pkey" PRIMARY KEY ("id")
    );
  `;

  try {
    await pool.query(sql);
    console.log("✅ BusService table created!");

    // Insert default data
    const insertSql = `
      INSERT INTO "BusService" ("id", "name", "routeFrom", "routeTo", "departureTime", "contactNumber", "fare", "description", "isActive")
      VALUES 
        ('bus-gangoh-delhi', 'Tourist Luxury Coach', 'Gangoh', 'Delhi', '6:00 AM', '9027437997', '₹500 per seat', 'Full AC | LED TV | Luxury Coach | Bus No: UP 11 DT 8397 | Daily Service | Comfortable & Safe Travel', true),
        ('bus-delhi-gangoh', 'Tourist Luxury Coach', 'Delhi', 'Gangoh', '6:00 PM', '9027437997', '₹500 per seat', 'Full AC | LED TV | Luxury Coach | Bus No: UP 11 DT 8397 | Daily Service | Comfortable & Safe Travel', true)
      ON CONFLICT ("id") DO NOTHING;
    `;
    await pool.query(insertSql);
    console.log("✅ Default bus services inserted!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

main();
