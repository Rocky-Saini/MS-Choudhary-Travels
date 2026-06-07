import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendTelegramNotification } from '@/lib/telegram'

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

    // Telegram notification
    const adminUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mschoudharytravles.netlify.app'
    const routeName = routeId === 'route-gangoh-delhi' ? 'Gangoh → Delhi' : 'Delhi → Gangoh'
    await sendTelegramNotification(
`⏳ *WAITING LIST - New Entry*

👤 *${customerName}*
📱 ${customerMobile}
📍 Route: ${routeName}
📅 Date: ${date}
🕐 Preferred: ${preferredTime || 'Not specified'}
📍 ${pickupPoint} → ${dropPoint}
💺 ${seats} seat(s)

⚠️ Action needed: Confirm seat when available

👉 [Open Waiting List](${adminUrl}/admin/dashboard)`)

    return NextResponse.json({ success: true, entry })
  } catch (error) {
    console.error('Waiting list error:', error)
    return NextResponse.json({ error: 'Failed to join waiting list' }, { status: 500 })
  }
}
