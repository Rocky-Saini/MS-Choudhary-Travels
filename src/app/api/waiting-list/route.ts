import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// User adds to waiting list
export async function POST(request: NextRequest) {
  try {
    const { customerName, customerMobile, routeId, date, pickupPoint, dropPoint, seats, preferredTime } = await request.json()

    if (!customerName || !customerMobile || !routeId || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Parse date as IST
    const [year, month, day] = date.split('-').map(Number)
    const istOffset = 330
    const dateUTC = new Date(Date.UTC(year, month - 1, day))
    dateUTC.setMinutes(dateUTC.getMinutes() - istOffset)

    const entry = await prisma.waitingList.create({
      data: {
        customerName,
        customerMobile,
        routeId,
        date: dateUTC,
        preferredTime: preferredTime || null,
        pickupPoint: pickupPoint || '',
        dropPoint: dropPoint || '',
        seats: seats || 1,
      },
    })

    return NextResponse.json({ success: true, entry })
  } catch (error) {
    console.error('Waiting list error:', error)
    return NextResponse.json({ error: 'Failed to join waiting list' }, { status: 500 })
  }
}
