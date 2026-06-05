import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  try {
    const adminCount = await prisma.admin.count();
    const driverCount = await prisma.driver.count();
    const vehicleCount = await prisma.vehicle.count();
    const tripCount = await prisma.trip.count();

    console.log("✅ Connected to Prisma Postgres!");
    console.log(`   Admins: ${adminCount}`);
    console.log(`   Drivers: ${driverCount}`);
    console.log(`   Vehicles: ${vehicleCount}`);
    console.log(`   Trips: ${tripCount}`);
  } catch (error) {
    console.error("❌ Connection failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
