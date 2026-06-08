import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Recalculate bookedSeats for all trips based on actual active bookings
  const trips = await prisma.trip.findMany({ select: { id: true } });

  for (const trip of trips) {
    const activeBookings = await prisma.booking.findMany({
      where: { tripId: trip.id, status: { in: ["CONFIRMED", "COMPLETED"] } },
      select: { seats: true },
    });
    const correctSeats = activeBookings.reduce((acc, b) => acc + b.seats, 0);

    await prisma.trip.update({
      where: { id: trip.id },
      data: { bookedSeats: correctSeats },
    });
    console.log(`Trip ${trip.id}: bookedSeats = ${correctSeats}`);
  }

  console.log("✅ All trip seat counts recalculated");
  await prisma.$disconnect();
}

main();
