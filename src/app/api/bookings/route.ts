import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { razorpay } from '@/lib/razorpay'
import { sendTelegramNotification } from '@/lib/telegram'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tripId, customerName, customerMobile, pickupPoint, dropPoint, seats } = body

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { route: true, vehicle: true, driver: true },
    })

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    const availableSeats = trip.totalSeats - trip.bookedSeats
    if (seats > availableSeats) {
      return NextResponse.json({ error: 'Not enough seats available' }, { status: 400 })
    }

    const totalFare = seats * trip.route.fare

    // If advance NOT required — create a PENDING request that needs admin approval.
    // Seat is NOT held here, so fake/unverified bookings can't block real seats.
    // Admin verifies via call/WhatsApp, then confirms (seat assigned at that point).
    if (!trip.advanceRequired) {
      const booking = await prisma.booking.create({
        data: {
          tripId,
          customerName,
          customerMobile,
          pickupPoint,
          dropPoint,
          seats,
          totalFare,
          advancePaid: 0,
          remainingFare: totalFare,
          status: 'PENDING',
        },
      })

      await prisma.notification.create({
        data: {
          bookingId: booking.id,
          type: 'BOOKING_CONFIRMED',
          message: `Booking request received. ${seats} seat(s). Awaiting admin confirmation.`,
        },
      })

      const departureTime = new Date(trip.departureTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })
      const tripDate = new Date(trip.date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })

      // Send Telegram notification to admin — this one needs manual approval
      await sendTelegramNotification(
`🆕 *NEW BOOKING REQUEST* (needs approval)

👤 *${customerName}*
📱 ${customerMobile}
🚗 Vehicle: ${trip.vehicle.vehicleNumber}
👨‍✈️ Driver: ${trip.driver.name} (${trip.driver.mobile})
📍 ${pickupPoint} → ${dropPoint}
📅 ${tripDate} • 🕐 ${departureTime}
💺 ${seats} seat(s) • 💰 ₹${totalFare}
🔖 Code: ${booking.bookingCode}

⏳ Status: PENDING — call/WhatsApp the customer to verify, then confirm.

👉 [Open Admin Panel](https://mschoudharytravles.netlify.app/admin/login)`)

      return NextResponse.json({
        success: true,
        requiresPayment: false,
        pendingApproval: true,
        booking: { id: booking.id, bookingCode: booking.bookingCode },
      })
    }

    // Advance required — create Razorpay order
    const advanceAmount = seats * trip.route.advanceAmount

    const booking = await prisma.booking.create({
      data: {
        tripId,
        customerName,
        customerMobile,
        pickupPoint,
        dropPoint,
        seats,
        totalFare,
        advancePaid: advanceAmount,
        remainingFare: totalFare - advanceAmount,
        status: 'PENDING',
      },
    })

    // Calculate total with Razorpay fee + GST (user bears the cost)
    const razorpayFee = Math.ceil(advanceAmount * 0.02)
    const gst = Math.ceil(razorpayFee * 0.18)
    const totalCharge = advanceAmount + razorpayFee + gst

    const order = await razorpay.orders.create({
      amount: totalCharge * 100, // in paise (advance + fee + GST)
      currency: 'INR',
      receipt: booking.id,
      notes: {
        bookingId: booking.id,
        customerName,
        customerMobile,
      },
    })

    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: advanceAmount,
        type: 'ADVANCE',
        razorpayOrderId: order.id,
        status: 'PENDING',
      },
    })

    return NextResponse.json({
      success: true,
      requiresPayment: true,
      booking: { id: booking.id, bookingCode: booking.bookingCode },
      order: { id: order.id, amount: order.amount },
    })
  } catch (error) {
    console.error('Booking error:', error)
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mobile = searchParams.get('mobile')
    const bookingCode = searchParams.get('code')

    const whereClause: Record<string, string> = {}
    if (mobile) whereClause.customerMobile = mobile
    if (bookingCode) whereClause.bookingCode = bookingCode

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        trip: {
          include: {
            vehicle: true,
            driver: true,
            route: true,
          },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
}
