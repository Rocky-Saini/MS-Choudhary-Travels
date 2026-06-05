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
    const vehicles = await prisma.vehicle.findMany({
      include: { driver: { select: { id: true, name: true, mobile: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ vehicles })
  } catch (error) {
    console.error('Error fetching vehicles:', error)
    return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const token = getToken(request)
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { vehicleNumber, driverId } = body

    const vehicle = await prisma.vehicle.create({
      data: {
        vehicleNumber,
        driverId: driverId || null,
      },
    })

    return NextResponse.json({ success: true, vehicle })
  } catch (error) {
    console.error('Error creating vehicle:', error)
    return NextResponse.json({ error: 'Failed to create vehicle' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const token = getToken(request)
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, vehicleNumber, driverId, isActive } = body

    const data: Record<string, unknown> = {}
    if (vehicleNumber !== undefined) data.vehicleNumber = vehicleNumber
    if (driverId !== undefined) data.driverId = driverId || null
    if (isActive !== undefined) data.isActive = isActive

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data,
    })

    return NextResponse.json({ success: true, vehicle })
  } catch (error) {
    console.error('Error updating vehicle:', error)
    return NextResponse.json({ error: 'Failed to update vehicle' }, { status: 500 })
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

    if (!id) {
      return NextResponse.json({ error: 'Vehicle ID required' }, { status: 400 })
    }

    // Check if vehicle has any trips with active bookings
    const activeTrips = await prisma.trip.findMany({
      where: {
        vehicleId: id,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        bookedSeats: { gt: 0 },
      },
    })

    if (activeTrips.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete vehicle with active bookings. Cancel trips first.',
      }, { status: 400 })
    }

    // Delete related data in order: notifications -> payments -> bookings -> trips -> vehicle
    const tripsWithBookings = await prisma.trip.findMany({
      where: { vehicleId: id },
      select: { id: true },
    })

    const tripIds = tripsWithBookings.map(t => t.id)

    if (tripIds.length > 0) {
      // Get all booking IDs for these trips
      const bookings = await prisma.booking.findMany({
        where: { tripId: { in: tripIds } },
        select: { id: true },
      })
      const bookingIds = bookings.map(b => b.id)

      if (bookingIds.length > 0) {
        // Delete notifications
        await prisma.notification.deleteMany({
          where: { bookingId: { in: bookingIds } },
        })
        // Delete payments
        await prisma.payment.deleteMany({
          where: { bookingId: { in: bookingIds } },
        })
        // Delete bookings
        await prisma.booking.deleteMany({
          where: { id: { in: bookingIds } },
        })
      }

      // Delete trips
      await prisma.trip.deleteMany({
        where: { vehicleId: id },
      })
    }

    // Finally delete vehicle
    await prisma.vehicle.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting vehicle:', error)
    return NextResponse.json({ error: 'Failed to delete vehicle' }, { status: 500 })
  }
}
