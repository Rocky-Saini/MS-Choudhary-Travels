import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function getToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  return authHeader?.replace('Bearer ', '') || null
}

export async function GET(request: NextRequest) {
  const token = getToken(request)
  const decoded = token ? verifyToken(token) : null
  if (!decoded || decoded.role !== 'driver') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')

    // IST date handling
    let dayStart: Date
    if (dateParam) {
      const [year, month, day] = dateParam.split('-').map(Number)
      const istOffset = 330
      dayStart = new Date(Date.UTC(year, month - 1, day))
      dayStart.setMinutes(dayStart.getMinutes() - istOffset)
    } else {
      const now = new Date()
      const istOffset = 330
      const istNow = new Date(now.getTime() + (istOffset + now.getTimezoneOffset()) * 60000)
      const todayStart = new Date(istNow.getFullYear(), istNow.getMonth(), istNow.getDate())
      dayStart = new Date(todayStart.getTime() - istOffset * 60000)
    }
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

    const trips = await prisma.trip.findMany({
      where: {
        driverId: decoded.id,
        date: { gte: dayStart, lt: dayEnd },
      },
      include: {
        vehicle: true,
        route: true,
        bookings: {
          where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
          select: {
            id: true,
            customerName: true,
            customerMobile: true,
            pickupPoint: true,
            dropPoint: true,
            seats: true,
            totalFare: true,
            advancePaid: true,
            remainingFare: true,
            status: true,
            feeCollected: true,
            paymentMode: true,
          },
        },
      },
      orderBy: { departureTime: 'asc' },
    })

    return NextResponse.json({ trips })
  } catch (error) {
    console.error('Error fetching driver trips:', error)
    return NextResponse.json({ error: 'Failed to fetch trips' }, { status: 500 })
  }
}
