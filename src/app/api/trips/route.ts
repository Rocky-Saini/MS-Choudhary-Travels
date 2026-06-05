import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Get start of day in IST, returned as UTC Date
function getISTDateStart(dateStr?: string): Date {
  if (dateStr) {
    // dateStr is YYYY-MM-DD, treat as IST date
    const [year, month, day] = dateStr.split('-').map(Number)
    // IST is UTC+5:30, so IST midnight = UTC previous day 18:30
    const utc = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
    utc.setMinutes(utc.getMinutes() - 330) // subtract 5:30 to get UTC equivalent of IST midnight
    return utc
  }
  // Today in IST
  const now = new Date()
  const istOffset = 330 // minutes
  const istNow = new Date(now.getTime() + (istOffset + now.getTimezoneOffset()) * 60000)
  const istMidnight = new Date(istNow.getFullYear(), istNow.getMonth(), istNow.getDate())
  // Convert IST midnight back to UTC
  return new Date(istMidnight.getTime() - istOffset * 60000)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const route = searchParams.get('route')
    const dateParam = searchParams.get('date') // YYYY-MM-DD in IST

    const dayStart = getISTDateStart(dateParam || undefined)
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

    const whereClause: Record<string, unknown> = {
      date: { gte: dayStart, lt: dayEnd },
      status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
    }

    if (route) {
      const [origin, destination] = route === 'gangoh-delhi'
        ? ['Gangoh', 'Delhi']
        : ['Delhi', 'Gangoh']
      whereClause.route = { origin, destination }
    }

    const trips = await prisma.trip.findMany({
      where: whereClause,
      include: { vehicle: true, driver: true, route: true },
      orderBy: { departureTime: 'asc' },
    })

    const formattedTrips = trips.map(trip => ({
      id: trip.id,
      vehicleNumber: trip.vehicle.vehicleNumber,
      driverName: trip.driver.name,
      driverMobile: trip.driver.mobile,
      departureTime: new Date(trip.departureTime).toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata',
      }),
      totalSeats: trip.totalSeats,
      bookedSeats: trip.bookedSeats,
      fare: trip.route.fare,
      route: `${trip.route.origin} → ${trip.route.destination}`,
      advanceRequired: trip.advanceRequired,
      tag: trip.tag || null,
      date: trip.date.toISOString().split('T')[0],
    }))

    return NextResponse.json({ trips: formattedTrips })
  } catch (error) {
    console.error('Error fetching trips:', error)
    return NextResponse.json({ error: 'Failed to fetch trips' }, { status: 500 })
  }
}
