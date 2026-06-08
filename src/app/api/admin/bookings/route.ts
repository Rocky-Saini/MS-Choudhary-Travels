import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function getToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  return authHeader?.replace('Bearer ', '') || null
}

function generateWhatsAppLink(phone: string, message: string): string {
  const clean = phone.replace(/\D/g, '').slice(-10)
  return `https://wa.me/91${clean}?text=${encodeURIComponent(message)}`
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

    let whatsappLink = ''

    // Admin confirming a pending request — assign the seat now (re-check availability)
    if (status === 'CONFIRMED' && existing.status === 'PENDING') {
      const trip = await prisma.trip.findUnique({
        where: { id: existing.tripId },
        include: { route: true, vehicle: true, driver: true },
      })
      if (!trip) {
        return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
      }

      const availableSeats = trip.totalSeats - trip.bookedSeats
      if (existing.seats > availableSeats) {
        return NextResponse.json({ error: `Only ${availableSeats} seat(s) left on this trip. Cannot confirm ${existing.seats}.` }, { status: 400 })
      }

      // Assign the seats now
      await prisma.trip.update({
        where: { id: existing.tripId },
        data: { bookedSeats: { increment: existing.seats } },
      })

      const booking = await prisma.booking.update({
        where: { id },
        data: { status: 'CONFIRMED' },
        include: { trip: { include: { vehicle: true, driver: true, route: true } } },
      })

      await prisma.notification.create({
        data: {
          bookingId: booking.id,
          type: 'BOOKING_CONFIRMED',
          message: `Booking confirmed by admin. ${booking.seats} seat(s). Code: ${booking.bookingCode}`,
        },
      })

      const tripDate = new Date(trip.date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })
      const departureTime = new Date(trip.departureTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })

      const message = `✅ *Seat Confirmed - Ready for Travel*

Hello ${booking.customerName}! 🙏

Your booking is confirmed:
🚗 Vehicle: ${trip.vehicle.vehicleNumber}
👤 Driver: ${trip.driver.name} (${trip.driver.mobile})
📍 Route: ${trip.route.origin} → ${trip.route.destination}
📅 Date: ${tripDate}
🕐 Time: ${departureTime}
💺 Seats: ${booking.seats}
💰 Fare: ₹${booking.totalFare} (pay to driver)

📍 Pickup: ${booking.pickupPoint}
📍 Drop: ${booking.dropPoint}

Booking Code: ${booking.bookingCode}

For help call: +91 7830673603 (Ajeem)
Thank you! Have a safe journey. 🙌
— MS Choudhary Travels`

      whatsappLink = generateWhatsAppLink(booking.customerMobile, message)

      return NextResponse.json({ success: true, booking, whatsappLink })
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: { trip: { include: { vehicle: true, driver: true, route: true } } },
    })

    if (status === 'CANCELLED') {
      // Only release seats if the booking was actually holding them.
      // PENDING requests never held a seat, so nothing to release.
      if (existing.status !== 'PENDING') {
        const trip = await prisma.trip.findUnique({ where: { id: booking.tripId } })
        if (trip && trip.bookedSeats > 0) {
          await prisma.trip.update({
            where: { id: booking.tripId },
            data: { bookedSeats: Math.max(0, trip.bookedSeats - booking.seats) },
          })
        }
      }

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
