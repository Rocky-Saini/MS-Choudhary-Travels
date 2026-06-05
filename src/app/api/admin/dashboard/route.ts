import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function getToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  return authHeader?.replace('Bearer ', '') || null
}

export async function GET(request: NextRequest) {
  const token = getToken(request)
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // IST today
    const now = new Date()
    const istOffset = 330
    const istNow = new Date(now.getTime() + (istOffset + now.getTimezoneOffset()) * 60000)
    const todayStart = new Date(istNow.getFullYear(), istNow.getMonth(), istNow.getDate())
    const todayStartUTC = new Date(todayStart.getTime() - istOffset * 60000)
    const tomorrowStartUTC = new Date(todayStartUTC.getTime() + 24 * 60 * 60 * 1000)

    const [
      totalRevenue,
      totalBookings,
      pendingPayments,
      todayBookings,
      totalVehicles,
      activeDrivers,
    ] = await Promise.all([
      prisma.payment.aggregate({ where: { status: 'SUCCESS' }, _sum: { amount: true } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'CONFIRMED', remainingFare: { gt: 0 } } }),
      prisma.booking.count({ where: { createdAt: { gte: todayStartUTC } } }),
      prisma.vehicle.count({ where: { isActive: true } }),
      prisma.driver.count({ where: { isActive: true } }),
    ])

    // Today's trips with full details
    const todayTrips = await prisma.trip.findMany({
      where: { date: { gte: todayStartUTC, lt: tomorrowStartUTC } },
      include: {
        vehicle: true,
        driver: true,
        route: true,
        bookings: {
          where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
          select: {
            id: true, customerName: true, customerMobile: true,
            pickupPoint: true, dropPoint: true, seats: true,
            totalFare: true, advancePaid: true, remainingFare: true, status: true,
          },
        },
      },
      orderBy: { departureTime: 'asc' },
    })

    const totalSeatsToday = todayTrips.reduce((acc, t) => acc + t.totalSeats, 0)
    const bookedSeatsToday = todayTrips.reduce((acc, t) => acc + t.bookedSeats, 0)

    return NextResponse.json({
      totalRevenue: totalRevenue._sum.amount || 0,
      totalBookings,
      pendingPayments,
      todayBookings,
      totalVehicles,
      activeDrivers,
      seatOccupancy: totalSeatsToday > 0 ? Math.round((bookedSeatsToday / totalSeatsToday) * 100) : 0,
      todayTrips: todayTrips.map(t => ({
        id: t.id,
        vehicleNumber: t.vehicle.vehicleNumber,
        driverName: t.driver.name,
        driverMobile: t.driver.mobile,
        route: `${t.route.origin} → ${t.route.destination}`,
        departureTime: new Date(t.departureTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }),
        totalSeats: t.totalSeats,
        bookedSeats: t.bookedSeats,
        availableSeats: t.totalSeats - t.bookedSeats,
        status: t.status,
        advanceRequired: t.advanceRequired,
        bookings: t.bookings,
      })),
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard' }, { status: 500 })
  }
}
