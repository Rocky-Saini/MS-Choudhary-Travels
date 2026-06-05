import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, hashPassword } from '@/lib/auth'

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
    const drivers = await prisma.driver.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, mobile: true, isActive: true },
    })
    return NextResponse.json({ drivers })
  } catch (error) {
    console.error('Error fetching drivers:', error)
    return NextResponse.json({ error: 'Failed to fetch drivers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const token = getToken(request)
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, mobile, password } = await request.json()
    const hashedPassword = await hashPassword(password)

    const driver = await prisma.driver.create({
      data: { name, mobile, password: hashedPassword },
    })

    return NextResponse.json({ success: true, driver: { id: driver.id, name: driver.name, mobile: driver.mobile } })
  } catch (error) {
    console.error('Error creating driver:', error)
    return NextResponse.json({ error: 'Failed to create driver' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const token = getToken(request)
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, password, ...rest } = body

    const data: Record<string, unknown> = { ...rest }
    if (password) {
      data.password = await hashPassword(password)
    }

    const driver = await prisma.driver.update({
      where: { id },
      data,
    })

    return NextResponse.json({ success: true, driver })
  } catch (error) {
    console.error('Error updating driver:', error)
    return NextResponse.json({ error: 'Failed to update driver' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const token = getToken(request)
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    // Check for active trips
    const activeTrips = await prisma.trip.findMany({
      where: { driverId: id, status: { in: ['SCHEDULED', 'IN_PROGRESS'] }, bookedSeats: { gt: 0 } },
    })

    if (activeTrips.length > 0) {
      return NextResponse.json({ error: 'Cannot delete driver with active bookings.' }, { status: 400 })
    }

    // Remove driver from vehicle
    await prisma.vehicle.updateMany({ where: { driverId: id }, data: { driverId: null } })

    // Delete related: liveLocations, trips (with bookings)
    await prisma.liveLocation.deleteMany({ where: { driverId: id } })

    const driverTrips = await prisma.trip.findMany({ where: { driverId: id }, select: { id: true } })
    const tripIds = driverTrips.map(t => t.id)

    if (tripIds.length > 0) {
      const bookings = await prisma.booking.findMany({ where: { tripId: { in: tripIds } }, select: { id: true } })
      const bookingIds = bookings.map(b => b.id)
      if (bookingIds.length > 0) {
        await prisma.notification.deleteMany({ where: { bookingId: { in: bookingIds } } })
        await prisma.payment.deleteMany({ where: { bookingId: { in: bookingIds } } })
        await prisma.booking.deleteMany({ where: { id: { in: bookingIds } } })
      }
      await prisma.trip.deleteMany({ where: { driverId: id } })
    }

    await prisma.driver.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting driver:', error)
    return NextResponse.json({ error: 'Failed to delete driver' }, { status: 500 })
  }
}
