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
      // Reset all trip booked seats to 0
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

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Clear data error:', error)
    return NextResponse.json({ error: 'Failed to clear' }, { status: 500 })
  }
}
