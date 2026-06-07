import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendTelegramNotification } from '@/lib/telegram'

// User submits full car booking request
export async function POST(request: NextRequest) {
  try {
    const { customerName, customerMobile, pickupPoint, dropPoint, date, preferredTime } = await request.json()

    if (!customerName || !customerMobile || !pickupPoint || !dropPoint || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (customerMobile.replace(/\D/g, '').length !== 10) {
      return NextResponse.json({ error: 'Invalid mobile number' }, { status: 400 })
    }

    const [year, month, day] = date.split('-').map(Number)
    const istOffset = 330
    const dateUTC = new Date(Date.UTC(year, month - 1, day))
    dateUTC.setMinutes(dateUTC.getMinutes() - istOffset)

    const entry = await prisma.fullCarBooking.create({
      data: { customerName, customerMobile, pickupPoint, dropPoint, date: dateUTC, preferredTime: preferredTime || null },
    })

    // Telegram notification
    const adminUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mschoudharytravles.netlify.app'
    await sendTelegramNotification(
`🚗 *FULL CAR REQUEST*

👤 *${customerName}*
📱 ${customerMobile}
📍 Pickup: ${pickupPoint}
📍 Drop: ${dropPoint}
📅 Date: ${date}
🕐 Time: ${preferredTime || 'Not specified'}

⚠️ *Action needed:* Approve & assign vehicle

👉 [Open Full Car Tab](${adminUrl}/admin/dashboard)`)

    return NextResponse.json({ success: true, entry })
  } catch (error) {
    console.error('Full car booking error:', error)
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 })
  }
}

// User checks status by mobile or booking ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mobile = searchParams.get('mobile')
    const bookingId = searchParams.get('id')

    if (bookingId) {
      // Search by partial ID (last 8 chars)
      const entries = await prisma.fullCarBooking.findMany({ orderBy: { createdAt: 'desc' } })
      const match = entries.find(e => e.id.slice(-8).toUpperCase() === bookingId.toUpperCase())
      return NextResponse.json({ entries: match ? [match] : [] })
    }

    if (!mobile) return NextResponse.json({ entries: [] })

    const entries = await prisma.fullCarBooking.findMany({
      where: { customerMobile: mobile },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ entries })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ entries: [] })
  }
}
