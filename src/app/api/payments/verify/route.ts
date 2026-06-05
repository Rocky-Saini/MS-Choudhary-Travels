import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = body

    // Verify signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(sign)
      .digest('hex')

    if (expectedSign !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    // Update payment
    await prisma.payment.updateMany({
      where: { razorpayOrderId: razorpay_order_id },
      data: {
        razorpayPaymentId: razorpay_payment_id,
        status: 'SUCCESS',
      },
    })

    // Update booking status
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED' },
    })

    // Update trip booked seats
    await prisma.trip.update({
      where: { id: booking.tripId },
      data: { bookedSeats: { increment: booking.seats } },
    })

    // Create notification
    await prisma.notification.create({
      data: {
        bookingId: booking.id,
        type: 'BOOKING_CONFIRMED',
        message: `Booking confirmed! ${booking.seats} seat(s) booked. Booking code: ${booking.bookingCode}`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 })
  }
}
