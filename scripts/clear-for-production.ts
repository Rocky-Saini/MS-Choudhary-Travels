import "dotenv/config";
import pg from "pg";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  console.log("🧹 Clearing all test data for production...");

  // Order matters due to foreign keys
  await pool.query('DELETE FROM "Notification"');
  console.log("  ✓ Notifications cleared");

  await pool.query('DELETE FROM "Payment"');
  console.log("  ✓ Payments cleared");

  await pool.query('DELETE FROM "Booking"');
  console.log("  ✓ Bookings cleared");

  await pool.query('DELETE FROM "LiveLocation"');
  console.log("  ✓ LiveLocations cleared");

  await pool.query('DELETE FROM "Trip"');
  console.log("  ✓ Trips cleared");

  await pool.query('DELETE FROM "WaitingList"');
  console.log("  ✓ WaitingList cleared");

  await pool.query('DELETE FROM "FullCarBooking"');
  console.log("  ✓ FullCarBooking cleared");

  console.log("\n✅ All trips & bookings cleared!");
  console.log("ℹ️  Kept: Admin, Drivers, Vehicles, Routes, BusService");

  await pool.end();
}

main();
