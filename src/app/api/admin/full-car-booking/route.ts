import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function getToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  return authHeader?.replace('Bearer ', '') || null
}

// Admin views all full car requests
export async function GET(request: NextRequest) {
  const token = getToken(request)
  if (!token || !verifyToken(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const entries = await prisma.fullCarBooking.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ entries })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ entries: [] })
  }
}

// Admin approves — assigns a trip/vehicle
export async function PUT(request: NextRequest) {
  const token = getToken(request)
  if (!token || !verifyToken(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id, status, tripId, adminNotes } = await request.json()

    const data: Record<string, unknown> = { status }
    if (tripId) data.tripId = tripId
    if (adminNotes) data.adminNotes = adminNotes

    const entry = await prisma.fullCarBooking.update({ where: { id }, data })

    // If approved with a trip, generate WhatsApp
    let whatsappLink = ''
    if (status === 'APPROVED' && tripId) {
      const trip = await prisma.trip.findUnique({ where: { id: tripId }, include: { vehicle: true, driver: true, route: true } })
      if (trip) {
        const departureTime = new Date(trip.departureTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })
        const tripDate = new Date(trip.date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })

        const message = `✅ *Full Car Booking Approved!*

Hello ${entry.customerName}! 🙏

Your full car request is approved:
🔖 Booking ID: ${entry.id.slice(-8).toUpperCase()}
🚗 Vehicle: ${trip.vehicle.vehicleNumber}
👤 Driver: ${trip.driver.name} (${trip.driver.mobile})
📍 Pickup: ${entry.pickupPoint}
📍 Drop: ${entry.dropPoint}
📅 Date: ${tripDate}
🕐 Time: ${departureTime}

💰 Fare: As discussed. Pay to driver after ride.

The full vehicle is reserved for you.
For help call: +91 7830673603

Thank you! 🙌
— MS Choudhary Travels`

        const clean = entry.customerMobile.replace(/\D/g, '').slice(-10)
        whatsappLink = `https://wa.me/91${clean}?text=${encodeURIComponent(message)}`
      }
    }

    return NextResponse.json({ success: true, entry, whatsappLink })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const token = getToken(request)
  if (!token || !verifyToken(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await prisma.fullCarBooking.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
