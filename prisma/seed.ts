import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin
  const adminPassword = await bcrypt.hash("admin123", 12);
  await prisma.admin.upsert({
    where: { email: "admin@cabbooking.com" },
    update: {},
    create: {
      email: "admin@cabbooking.com",
      password: adminPassword,
      name: "Admin",
    },
  });
  console.log("✅ Admin created: admin@cabbooking.com / admin123");

  // Create routes
  const gangohDelhi = await prisma.route.upsert({
    where: { id: "route-gangoh-delhi" },
    update: {},
    create: {
      id: "route-gangoh-delhi",
      origin: "Gangoh",
      destination: "Delhi",
      fare: 350,
      advanceAmount: 100,
      distance: "170 km",
      duration: "4 hours",
    },
  });

  const delhiGangoh = await prisma.route.upsert({
    where: { id: "route-delhi-gangoh" },
    update: {},
    create: {
      id: "route-delhi-gangoh",
      origin: "Delhi",
      destination: "Gangoh",
      fare: 350,
      advanceAmount: 100,
      distance: "170 km",
      duration: "4 hours",
    },
  });
  console.log("✅ Routes created");

  // Create drivers
  const driverPassword = await bcrypt.hash("driver123", 12);
  const driverData = [
    { name: "Rajesh Kumar", mobile: "9876543210" },
    { name: "Sunil Sharma", mobile: "9876543211" },
    { name: "Amit Singh", mobile: "9876543212" },
    { name: "Vikram Yadav", mobile: "9876543213" },
    { name: "Deepak Verma", mobile: "9876543214" },
    { name: "Rahul Gupta", mobile: "9876543215" },
    { name: "Sandeep Chauhan", mobile: "9876543216" },
    { name: "Manoj Tiwari", mobile: "9876543217" },
  ];

  const drivers = [];
  for (const d of driverData) {
    const driver = await prisma.driver.upsert({
      where: { mobile: d.mobile },
      update: {},
      create: { ...d, password: driverPassword },
    });
    drivers.push(driver);
  }
  console.log("✅ 8 Drivers created (password: driver123)");

  // Create vehicles
  const vehicleNumbers = [
    "UP14 AB 1001",
    "UP14 AB 1002",
    "UP14 AB 1003",
    "UP14 AB 1004",
    "UP14 AB 1005",
    "UP14 AB 1006",
    "UP14 AB 1007",
    "UP14 AB 1008",
  ];

  const vehicles = [];
  for (let i = 0; i < vehicleNumbers.length; i++) {
    const vehicle = await prisma.vehicle.upsert({
      where: { vehicleNumber: vehicleNumbers[i] },
      update: {},
      create: {
        vehicleNumber: vehicleNumbers[i],
        driverId: drivers[i].id,
      },
    });
    vehicles.push(vehicle);
  }
  console.log("✅ 8 Vehicles created & assigned to drivers");

  // Create today's trips
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const departureTimes = [
    "06:00",
    "07:00",
    "08:00",
    "09:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
  ];

  for (let i = 0; i < 8; i++) {
    const [hours, minutes] = departureTimes[i].split(":").map(Number);
    const departureTime = new Date(today);
    departureTime.setHours(hours, minutes, 0, 0);

    const route = i < 4 ? gangohDelhi : delhiGangoh;

    await prisma.trip.create({
      data: {
        vehicleId: vehicles[i].id,
        driverId: drivers[i].id,
        routeId: route.id,
        departureTime,
        date: today,
        bookedSeats: Math.floor(Math.random() * 4),
      },
    });
  }
  console.log("✅ 8 Trips created for today");

  console.log("\n🎉 Database seeded successfully!");
  console.log("\n📋 Credentials:");
  console.log("   Admin: admin@cabbooking.com / admin123");
  console.log("   Drivers: 9876543210-17 / driver123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
