import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function getToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  return authHeader?.replace('Bearer ', '') || null
}

export async function DELETE(request: NextRequest) {
  const token = getToken(request)
  if (!token || !verifyToken(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'bookings' | 'waiting' | 'fullcar'

    if (type === 'bookings') {
      await prisma.notification.deleteMany({})
      await prisma.payment.deleteMany({})
      await prisma.booking.deleteMany({})
      await prisma.trip.updateMany({ data: { bookedSeats: 0 } })
      return NextResponse.json({ success: true, message: 'All bookings cleared' })
    }

    if (type === 'waiting') {
      await prisma.waitingList.deleteMany({})
      return NextResponse.json({ success: true, message: 'Waiting list cleared' })
    }

    if (type === 'fullcar') {
      await prisma.fullCarBooking.deleteMany({})
      return NextResponse.json({ success: true, message: 'Full car requests cleared' })
    }

    if (type === 'trips') {
      await prisma.notification.deleteMany({})
      await prisma.payment.deleteMany({})
      await prisma.booking.deleteMany({})
      await prisma.trip.deleteMany({})
      return NextResponse.json({ success: true, message: 'All trips cleared' })
    }

    // Single item delete
    const id = searchParams.get('id')
    if (type === 'booking' && id) {
      await prisma.notification.deleteMany({ where: { bookingId: id } })
      await prisma.payment.deleteMany({ where: { bookingId: id } })
      const booking = await prisma.booking.delete({ where: { id } })
      // Only release seats if this booking was actually holding them.
      // PENDING bookings never reserved a seat, and CANCELLED ones were already released.
      if (booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') {
        const trip = await prisma.trip.findUnique({ where: { id: booking.tripId } })
        if (trip) {
          await prisma.trip.update({
            where: { id: booking.tripId },
            data: { bookedSeats: Math.max(0, trip.bookedSeats - booking.seats) },
          })
        }
      }
      return NextResponse.json({ success: true })
    }

    if (type === 'waiting-item' && id) {
      await prisma.waitingList.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (type === 'fullcar-item' && id) {
      await prisma.fullCarBooking.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Clear data error:', error)
    return NextResponse.json({ error: 'Failed to clear' }, { status: 500 })
  }
}
