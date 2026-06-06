import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function getToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  return authHeader?.replace('Bearer ', '') || null
}

const ADMIN_WHATSAPP = '917830673603'

function generateWhatsAppLink(phone: string, message: string): string {
  // Remove +91 or 0 prefix, ensure 10 digit
  const clean = phone.replace(/\D/g, '').slice(-10)
  const fullNumber = `91${clean}`
  return `https://wa.me/${fullNumber}?text=${encodeURIComponent(message)}`
}

export async function POST(request: NextRequest) {
  const token = getToken(request)
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { tripId, customerName, customerMobile, pickupPoint, dropPoint, seats } = await request.json()

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { route: true, vehicle: true, driver: true },
    })

    if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })

    const availableSeats = trip.totalSeats - trip.bookedSeats
    if (seats > availableSeats) {
      return NextResponse.json({ error: `Only ${availableSeats} seats available` }, { status: 400 })
    }

    const totalFare = seats * trip.route.fare

    // Admin books directly — confirmed, no advance needed
    const booking = await prisma.booking.create({
      data: {
        tripId,
        customerName,
        customerMobile,
        pickupPoint,
        dropPoint,
        seats,
        totalFare,
        advancePaid: 0,
        remainingFare: totalFare,
        status: 'CONFIRMED',
      },
    })

    // Update trip seats
    await prisma.trip.update({
      where: { id: tripId },
      data: { bookedSeats: { increment: seats } },
    })

    // Create notification
    await prisma.notification.create({
      data: {
        bookingId: booking.id,
        type: 'BOOKING_CONFIRMED',
        message: `Booking confirmed by admin. ${seats} seat(s). Code: ${booking.bookingCode}`,
      },
    })

    // Generate WhatsApp message
    const departureTime = new Date(trip.departureTime).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata',
    })
    const tripDate = new Date(trip.date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })

    const whatsappMessage = `✅ *Seat Confirmed - Ready for Travel*

Hello ${customerName}! 🙏

Your booking is confirmed:
🚗 Vehicle: ${trip.vehicle.vehicleNumber}
👤 Driver: ${trip.driver.name} (${trip.driver.mobile})
📍 Route: ${trip.route.origin} → ${trip.route.destination}
📅 Date: ${tripDate}
🕐 Time: ${departureTime}
💺 Seats: ${seats}
💰 Fare: ₹${totalFare} (pay to driver)

📍 Pickup: ${pickupPoint}
📍 Drop: ${dropPoint}

Booking Code: ${booking.bookingCode}

For help call: +91 7830673603 (Ajeem)
Thank you! Have a safe journey. 🙌
— MS Choudhary Travels`

    const whatsappLink = generateWhatsAppLink(customerMobile, whatsappMessage)

    return NextResponse.json({
      success: true,
      booking: { id: booking.id, bookingCode: booking.bookingCode },
      whatsappLink,
    })
  } catch (error) {
    console.error('Admin book seat error:', error)
    return NextResponse.json({ error: 'Failed to book seat' }, { status: 500 })
  }
}
