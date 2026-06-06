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
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const date = searchParams.get('date')

    const whereClause: Record<string, unknown> = {}
    if (status) whereClause.status = status
    if (date) {
      const d = new Date(date)
      const nextDay = new Date(d)
      nextDay.setDate(nextDay.getDate() + 1)
      whereClause.createdAt = { gte: d, lt: nextDay }
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        trip: {
          include: {
            vehicle: true,
            driver: true,
            route: true,
          },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const token = getToken(request)
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, status } = body

    // Get current booking first to check existing status
    const existing = await prisma.booking.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Prevent re-cancelling an already cancelled booking
    if (status === 'CANCELLED' && existing.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Booking is already cancelled' }, { status: 400 })
    }

    // Prevent changing status of a completed booking
    if (existing.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Cannot change a completed booking' }, { status: 400 })
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: { trip: { include: { vehicle: true, driver: true, route: true } } },
    })

    let whatsappLink = ''

    if (status === 'CANCELLED') {
      // Only decrement seats if the booking was previously occupying seats (not already cancelled)
      await prisma.trip.update({
        where: { id: booking.tripId },
        data: { bookedSeats: { decrement: booking.seats } },
      })

      const tripDate = new Date(booking.trip.date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })
      const departureTime = new Date(booking.trip.departureTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })

      const message = `❌ *Booking Cancelled*

Hello ${booking.customerName},

Your booking has been cancelled:
📍 Route: ${booking.trip.route.origin} → ${booking.trip.route.destination}
🚗 Vehicle: ${booking.trip.vehicle.vehicleNumber}
📅 Date: ${tripDate}
🕐 Time: ${departureTime}
💺 Seats: ${booking.seats}
🔖 Booking Code: ${booking.bookingCode}

${booking.advancePaid > 0 ? `Your advance of ₹${booking.advancePaid} will be refunded shortly.\n\n` : ''}For any queries, call: +91 7830673603 (Ajeem)

We apologize for any inconvenience.
— MS Choudhary Travels`

      const clean = booking.customerMobile.replace(/\D/g, '').slice(-10)
      whatsappLink = `https://wa.me/91${clean}?text=${encodeURIComponent(message)}`

      await prisma.notification.create({
        data: {
          bookingId: booking.id,
          type: 'BOOKING_CONFIRMED',
          message: `Booking cancelled. ${booking.advancePaid > 0 ? `Advance ₹${booking.advancePaid} will be refunded.` : ''}`,
        },
      })
    }

    return NextResponse.json({ success: true, booking, whatsappLink })
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
  }
}
