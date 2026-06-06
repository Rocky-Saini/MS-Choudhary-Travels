import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function getToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  return authHeader?.replace('Bearer ', '') || null
}

// Admin confirms a waiting-list entry into a specific trip
export async function POST(request: NextRequest) {
  const token = getToken(request)
  const decoded = token ? verifyToken(token) : null
  if (!decoded || decoded.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { waitingId, tripId } = await request.json()

    const waiting = await prisma.waitingList.findUnique({ where: { id: waitingId } })
    if (!waiting) return NextResponse.json({ error: 'Waiting entry not found' }, { status: 404 })

    const trip = await prisma.trip.findUnique({ where: { id: tripId }, include: { route: true, vehicle: true, driver: true } })
    if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })

    const available = trip.totalSeats - trip.bookedSeats
    if (waiting.seats > available) {
      return NextResponse.json({ error: `Only ${available} seats available` }, { status: 400 })
    }

    const totalFare = waiting.seats * trip.route.fare

    // Create confirmed booking
    const booking = await prisma.booking.create({
      data: {
        tripId,
        customerName: waiting.customerName,
        customerMobile: waiting.customerMobile,
        pickupPoint: waiting.pickupPoint || trip.route.origin,
        dropPoint: waiting.dropPoint || trip.route.destination,
        seats: waiting.seats,
        totalFare,
        advancePaid: 0,
        remainingFare: totalFare,
        status: 'CONFIRMED',
      },
    })

    await prisma.trip.update({
      where: { id: tripId },
      data: { bookedSeats: { increment: waiting.seats } },
    })

    // Mark waiting entry as confirmed
    await prisma.waitingList.update({ where: { id: waitingId }, data: { status: 'CONFIRMED' } })

    // WhatsApp confirmation
    const departureTime = new Date(trip.departureTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })
    const tripDate = new Date(trip.date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })

    const message = `✅ *Great News! Seat Available*

Hello ${waiting.customerName}! 🙏

A seat opened up and we've confirmed your booking:
🚗 Vehicle: ${trip.vehicle.vehicleNumber}
👤 Driver: ${trip.driver.name} (${trip.driver.mobile})
📍 Route: ${trip.route.origin} → ${trip.route.destination}
📅 Date: ${tripDate}
🕐 Time: ${departureTime}
💺 Seats: ${waiting.seats}
💰 Fare: ₹${totalFare} (pay to driver)

Booking Code: ${booking.bookingCode}

For help call: +91 7830673603
Thank you for your patience! 🙌
— MS Choudhary Travels`

    const clean = waiting.customerMobile.replace(/\D/g, '').slice(-10)
    const whatsappLink = `https://wa.me/91${clean}?text=${encodeURIComponent(message)}`

    return NextResponse.json({ success: true, whatsappLink })
  } catch (error) {
    console.error('Confirm waiting error:', error)
    return NextResponse.json({ error: 'Failed to confirm' }, { status: 500 })
  }
}
