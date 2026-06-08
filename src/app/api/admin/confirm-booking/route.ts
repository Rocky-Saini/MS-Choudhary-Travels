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

// Admin confirms a PENDING booking and assigns it to a chosen trip (the original
// cab or a different one). PENDING bookings don't hold a seat, so we only need to
// increment the chosen trip's seats here.
export async function POST(request: NextRequest) {
  const token = getToken(request)
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { bookingId, tripId } = await request.json()

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    if (booking.status !== 'PENDING') {
      return NextResponse.json({ error: 'Only pending bookings can be confirmed & assigned' }, { status: 400 })
    }

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { route: true, vehicle: true, driver: true },
    })
    if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })

    const available = trip.totalSeats - trip.bookedSeats
    if (booking.seats > available) {
      return NextResponse.json({ error: `Only ${available} seat(s) available in ${trip.vehicle.vehicleNumber}` }, { status: 400 })
    }

    const totalFare = booking.seats * trip.route.fare

    // Assign seats on the chosen trip
    await prisma.trip.update({
      where: { id: tripId },
      data: { bookedSeats: { increment: booking.seats } },
    })

    // Confirm booking — move to chosen trip and recompute fare for that route
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        tripId,
        status: 'CONFIRMED',
        totalFare,
        remainingFare: totalFare - booking.advancePaid,
      },
    })

    await prisma.notification.create({
      data: {
        bookingId: updated.id,
        type: 'BOOKING_CONFIRMED',
        message: `Booking confirmed by admin. ${updated.seats} seat(s) on ${trip.vehicle.vehicleNumber}. Code: ${updated.bookingCode}`,
      },
    })

    const departureTime = new Date(trip.departureTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })
    const tripDate = new Date(trip.date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })

    const message = `✅ *Seat Confirmed - Ready for Travel*

Hello ${updated.customerName}! 🙏

Your booking is confirmed:
🚗 Vehicle: ${trip.vehicle.vehicleNumber}
👤 Driver: ${trip.driver.name} (${trip.driver.mobile})
📍 Route: ${trip.route.origin} → ${trip.route.destination}
📅 Date: ${tripDate}
🕐 Time: ${departureTime}
💺 Seats: ${updated.seats}
💰 Fare: ₹${totalFare} (pay to driver)

📍 Pickup: ${updated.pickupPoint}
📍 Drop: ${updated.dropPoint}

Booking Code: ${updated.bookingCode}

For help call: +91 7830673603 (Ajeem)
Thank you! Have a safe journey. 🙌
— MS Choudhary Travels`

    const whatsappLink = generateWhatsAppLink(updated.customerMobile, message)

    return NextResponse.json({ success: true, whatsappLink })
  } catch (error) {
    console.error('Confirm booking error:', error)
    return NextResponse.json({ error: 'Failed to confirm booking' }, { status: 500 })
  }
}
