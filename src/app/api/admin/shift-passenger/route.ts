import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function getToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  return authHeader?.replace('Bearer ', '') || null
}

export async function POST(request: NextRequest) {
  const token = getToken(request)
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { bookingId, newTripId } = await request.json()

    // Get current booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { trip: { include: { vehicle: true, driver: true, route: true } } },
    })
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    // Get new trip
    const newTrip = await prisma.trip.findUnique({
      where: { id: newTripId },
      include: { vehicle: true, driver: true, route: true },
    })
    if (!newTrip) return NextResponse.json({ error: 'Target trip not found' }, { status: 404 })

    // Check seats available in new trip
    const available = newTrip.totalSeats - newTrip.bookedSeats
    if (booking.seats > available) {
      return NextResponse.json({ error: `Only ${available} seats available in target vehicle` }, { status: 400 })
    }

    // Decrement old trip seats
    await prisma.trip.update({
      where: { id: booking.tripId },
      data: { bookedSeats: { decrement: booking.seats } },
    })

    // Increment new trip seats
    await prisma.trip.update({
      where: { id: newTripId },
      data: { bookedSeats: { increment: booking.seats } },
    })

    // Update booking to new trip
    await prisma.booking.update({
      where: { id: bookingId },
      data: { tripId: newTripId },
    })

    // Generate WhatsApp notification
    const departureTime = new Date(newTrip.departureTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })
    const tripDate = new Date(newTrip.date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })

    const message = `🔄 *Booking Updated*

Hello ${booking.customerName}! 🙏

Your vehicle has been changed:
🚗 New Vehicle: ${newTrip.vehicle.vehicleNumber}
👤 Driver: ${newTrip.driver.name} (${newTrip.driver.mobile})
📍 Route: ${newTrip.route.origin} → ${newTrip.route.destination}
📅 Date: ${tripDate}
🕐 Time: ${departureTime}
💺 Seats: ${booking.seats}

All other details remain same.
For help call: +91 7830673603 (Ajeem)

Thank you! 🙌`

    const clean = booking.customerMobile.replace(/\D/g, '').slice(-10)
    const whatsappLink = `https://wa.me/91${clean}?text=${encodeURIComponent(message)}`

    return NextResponse.json({ success: true, whatsappLink })
  } catch (error) {
    console.error('Shift passenger error:', error)
    return NextResponse.json({ error: 'Failed to shift passenger' }, { status: 500 })
  }
}
