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
    const trips = await prisma.trip.findMany({
      include: {
        vehicle: true,
        driver: true,
        route: true,
        bookings: true,
      },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json({ trips })
  } catch (error) {
    console.error('Error fetching trips:', error)
    return NextResponse.json({ error: 'Failed to fetch trips' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const token = getToken(request)
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { vehicleId, driverId, routeId, departureTime, date, advanceRequired, tag } = body

    // Parse date as IST — date comes as "YYYY-MM-DD", time as "HH:MM"
    const [year, month, day] = date.split('-').map(Number)
    const [hours, minutes] = departureTime.split(':').map(Number)
    
    // Create date in IST (UTC+5:30) then convert to UTC for storage
    const istOffset = 330 // minutes
    const dateAtMidnightIST = new Date(Date.UTC(year, month - 1, day))
    dateAtMidnightIST.setMinutes(dateAtMidnightIST.getMinutes() - istOffset)
    
    const departureIST = new Date(Date.UTC(year, month - 1, day, hours, minutes))
    departureIST.setMinutes(departureIST.getMinutes() - istOffset)

    const trip = await prisma.trip.create({
      data: {
        vehicleId,
        driverId,
        routeId,
        departureTime: departureIST,
        date: dateAtMidnightIST,
        advanceRequired: advanceRequired || false,
        tag: tag || null,
      },
    })

    return NextResponse.json({ success: true, trip })
  } catch (error) {
    console.error('Error creating trip:', error)
    return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const token = getToken(request)
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, departureTime, date, ...rest } = body

    const updateData: Record<string, unknown> = { ...rest }

    // If date and time are being updated, convert to IST-aware UTC
    if (date && departureTime && departureTime.length === 5) {
      const [year, month, day] = date.split('-').map(Number)
      const [hours, minutes] = departureTime.split(':').map(Number)
      const istOffset = 330

      const dateAtMidnightIST = new Date(Date.UTC(year, month - 1, day))
      dateAtMidnightIST.setMinutes(dateAtMidnightIST.getMinutes() - istOffset)

      const departureIST = new Date(Date.UTC(year, month - 1, day, hours, minutes))
      departureIST.setMinutes(departureIST.getMinutes() - istOffset)

      updateData.date = dateAtMidnightIST
      updateData.departureTime = departureIST
    } else if (date) {
      // Only date updated
      const [year, month, day] = date.split('-').map(Number)
      const istOffset = 330
      const dateAtMidnightIST = new Date(Date.UTC(year, month - 1, day))
      dateAtMidnightIST.setMinutes(dateAtMidnightIST.getMinutes() - istOffset)
      updateData.date = dateAtMidnightIST
    }

    const trip = await prisma.trip.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, trip })
  } catch (error) {
    console.error('Error updating trip:', error)
    return NextResponse.json({ error: 'Failed to update trip' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const token = getToken(request)
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Trip ID required' }, { status: 400 })

    // Delete related: notifications -> payments -> bookings -> trip
    const bookings = await prisma.booking.findMany({
      where: { tripId: id },
      select: { id: true },
    })
    const bookingIds = bookings.map(b => b.id)

    if (bookingIds.length > 0) {
      await prisma.notification.deleteMany({ where: { bookingId: { in: bookingIds } } })
      await prisma.payment.deleteMany({ where: { bookingId: { in: bookingIds } } })
      await prisma.booking.deleteMany({ where: { tripId: id } })
    }

    await prisma.trip.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting trip:', error)
    return NextResponse.json({ error: 'Failed to delete trip' }, { status: 500 })
  }
}
