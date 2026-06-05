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
    const { bookingAId, bookingBId } = await request.json()

    const bookingA = await prisma.booking.findUnique({
      where: { id: bookingAId },
      include: { trip: { include: { vehicle: true, driver: true, route: true } } },
    })
    const bookingB = await prisma.booking.findUnique({
      where: { id: bookingBId },
      include: { trip: { include: { vehicle: true, driver: true, route: true } } },
    })

    if (!bookingA || !bookingB) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (bookingA.tripId === bookingB.tripId) {
      return NextResponse.json({ error: 'Both passengers are in the same vehicle' }, { status: 400 })
    }

    // Check seat compatibility
    const tripA = bookingA.trip
    const tripB = bookingB.trip

    // After removing A from tripA, tripA has space = (totalSeats - bookedSeats + A.seats)
    // B needs to fit in tripA: B.seats <= (tripA.totalSeats - tripA.bookedSeats + A.seats)
    const spaceInTripAAfterRemovingA = tripA.totalSeats - tripA.bookedSeats + bookingA.seats
    if (bookingB.seats > spaceInTripAAfterRemovingA) {
      return NextResponse.json({ error: `Not enough seats in ${tripA.vehicle.vehicleNumber} for ${bookingB.customerName}` }, { status: 400 })
    }

    const spaceInTripBAfterRemovingB = tripB.totalSeats - tripB.bookedSeats + bookingB.seats
    if (bookingA.seats > spaceInTripBAfterRemovingB) {
      return NextResponse.json({ error: `Not enough seats in ${tripB.vehicle.vehicleNumber} for ${bookingA.customerName}` }, { status: 400 })
    }

    // Perform the swap
    // Update booking A → trip B
    await prisma.booking.update({ where: { id: bookingAId }, data: { tripId: bookingB.tripId } })
    // Update booking B → trip A
    await prisma.booking.update({ where: { id: bookingBId }, data: { tripId: bookingA.tripId } })

    // Update seat counts
    // Trip A: lost A.seats, gained B.seats
    await prisma.trip.update({
      where: { id: tripA.id },
      data: { bookedSeats: tripA.bookedSeats - bookingA.seats + bookingB.seats },
    })
    // Trip B: lost B.seats, gained A.seats
    await prisma.trip.update({
      where: { id: tripB.id },
      data: { bookedSeats: tripB.bookedSeats - bookingB.seats + bookingA.seats },
    })

    // Generate WhatsApp links for both
    const timeA = new Date(tripA.departureTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })
    const timeB = new Date(tripB.departureTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })

    const msgA = `🔄 *Vehicle Changed*\n\nHello ${bookingA.customerName}!\n\nYour vehicle has been updated:\n🚗 New Vehicle: ${tripB.vehicle.vehicleNumber}\n👤 Driver: ${tripB.driver.name} (${tripB.driver.mobile})\n🕐 Time: ${timeB}\n\nAll other details remain same.\nFor help: +91 7830673603`
    const msgB = `🔄 *Vehicle Changed*\n\nHello ${bookingB.customerName}!\n\nYour vehicle has been updated:\n🚗 New Vehicle: ${tripA.vehicle.vehicleNumber}\n👤 Driver: ${tripA.driver.name} (${tripA.driver.mobile})\n🕐 Time: ${timeA}\n\nAll other details remain same.\nFor help: +91 7830673603`

    const cleanA = bookingA.customerMobile.replace(/\D/g, '').slice(-10)
    const cleanB = bookingB.customerMobile.replace(/\D/g, '').slice(-10)

    return NextResponse.json({
      success: true,
      whatsappLinkA: `https://wa.me/91${cleanA}?text=${encodeURIComponent(msgA)}`,
      whatsappLinkB: `https://wa.me/91${cleanB}?text=${encodeURIComponent(msgB)}`,
      passengerA: bookingA.customerName,
      passengerB: bookingB.customerName,
    })
  } catch (error) {
    console.error('Exchange error:', error)
    return NextResponse.json({ error: 'Failed to exchange passengers' }, { status: 500 })
  }
}
