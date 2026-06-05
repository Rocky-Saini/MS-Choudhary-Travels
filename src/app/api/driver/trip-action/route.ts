import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function getToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  return authHeader?.replace('Bearer ', '') || null
}

export async function POST(request: NextRequest) {
  const token = getToken(request)
  const decoded = token ? verifyToken(token) : null
  if (!decoded || decoded.role !== 'driver') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { tripId, action } = await request.json()

    const trip = await prisma.trip.findFirst({
      where: { id: tripId, driverId: decoded.id },
    })

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    if (action === 'start') {
      await prisma.trip.update({
        where: { id: tripId },
        data: { status: 'IN_PROGRESS', startedAt: new Date() },
      })

      // Notify passengers
      const bookings = await prisma.booking.findMany({
        where: { tripId, status: 'CONFIRMED' },
      })

      for (const booking of bookings) {
        await prisma.notification.create({
          data: {
            bookingId: booking.id,
            type: 'JOURNEY_STARTED',
            message: 'Your journey has started! Track your vehicle live.',
          },
        })
      }
    } else if (action === 'stop') {
      await prisma.trip.update({
        where: { id: tripId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      })

      // Update all bookings to completed
      await prisma.booking.updateMany({
        where: { tripId, status: 'CONFIRMED' },
        data: { status: 'COMPLETED' },
      })

      const bookings = await prisma.booking.findMany({
        where: { tripId, status: 'COMPLETED' },
      })

      for (const booking of bookings) {
        await prisma.notification.create({
          data: {
            bookingId: booking.id,
            type: 'TRIP_COMPLETED',
            message: 'Your trip has been completed. Thank you for traveling with us!',
          },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Trip action error:', error)
    return NextResponse.json({ error: 'Failed to perform trip action' }, { status: 500 })
  }
}
