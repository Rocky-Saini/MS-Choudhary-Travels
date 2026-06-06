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
    const { bookingId, paymentMode } = await request.json() // paymentMode: 'CASH' | 'ONLINE'

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { trip: true },
    })
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    // Verify this booking belongs to driver's trip
    if (booking.trip.driverId !== decoded.id) {
      return NextResponse.json({ error: 'Not authorized for this booking' }, { status: 403 })
    }

    if (booking.feeCollected) {
      return NextResponse.json({ error: 'Payment already collected' }, { status: 400 })
    }

    // Mark fee collected
    await prisma.booking.update({
      where: { id: bookingId },
      data: { feeCollected: true, paymentMode },
    })

    // Record payment for the remaining fare
    if (booking.remainingFare > 0) {
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount: booking.remainingFare,
          type: 'REMAINING',
          status: 'SUCCESS',
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Collect payment error:', error)
    return NextResponse.json({ error: 'Failed to collect payment' }, { status: 500 })
  }
}
