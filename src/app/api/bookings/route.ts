import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { razorpay } from '@/lib/razorpay'
import { sendTelegramNotification } from '@/lib/telegram'

const ADMIN_PHONE = '919027437997'

function generateWhatsAppLink(phone: string, message: string): string {
  const clean = phone.replace(/\D/g, '').slice(-10)
  return `https://wa.me/91${clean}?text=${encodeURIComponent(message)}`
}

function buildConfirmationMessage(data: {
  customerName: string; vehicleNumber: string; driverName: string; driverMobile: string
  origin: string; destination: string; departureTime: string; date: string
  seats: number; totalFare: number; pickupPoint: string; dropPoint: string; bookingCode: string
}): string {
  return `✅ *Seat Confirmed - Ready for Travel*

Hello ${data.customerName}! 🙏

Your booking is confirmed:
🚗 Vehicle: ${data.vehicleNumber}
👤 Driver: ${data.driverName} (${data.driverMobile})
📍 Route: ${data.origin} → ${data.destination}
📅 Date: ${data.date}
🕐 Time: ${data.departureTime}
💺 Seats: ${data.seats}
💰 Fare: ₹${data.totalFare} (pay to driver)

📍 Pickup: ${data.pickupPoint}
📍 Drop: ${data.dropPoint}

Booking Code: ${data.bookingCode}

For help call: +91 7830673603 (Ajeem)
Thank you! Have a safe journey. 🙌
— MS Choudhary Travels`
}

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

    // If advance NOT required — direct confirm, no payment needed now
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
          status: 'CONFIRMED',
        },
      })

      // Update trip booked seats
      await prisma.trip.update({
        where: { id: tripId },
        data: { bookedSeats: { increment: seats } },
      })

      await prisma.notification.create({
        data: {
          bookingId: booking.id,
          type: 'BOOKING_CONFIRMED',
          message: `Booking confirmed! ${seats} seat(s) booked. Payment after journey.`,
        },
      })

      const departureTime = new Date(trip.departureTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })
      const tripDate = new Date(trip.date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })

      const whatsappMessage = buildConfirmationMessage({
        customerName, vehicleNumber: trip.vehicle.vehicleNumber,
        driverName: trip.driver.name, driverMobile: trip.driver.mobile,
        origin: trip.route.origin, destination: trip.route.destination,
        departureTime, date: tripDate, seats, totalFare,
        pickupPoint, dropPoint, bookingCode: booking.bookingCode,
      })
      const whatsappLink = generateWhatsAppLink(customerMobile, whatsappMessage)

      // Send Telegram notification to admin
      const adminUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mschoudharytravles.netlify.app'
      await sendTelegramNotification(
`🆕 *NEW BOOKING*

👤 *${customerName}*
📱 ${customerMobile}
🚗 Vehicle: ${trip.vehicle.vehicleNumber}
👨‍✈️ Driver: ${trip.driver.name} (${trip.driver.mobile})
📍 ${pickupPoint} → ${dropPoint}
📅 ${tripDate} • 🕐 ${departureTime}
💺 ${seats} seat(s) • 💰 ₹${totalFare}
🔖 Code: ${booking.bookingCode}

⚡ Status: CONFIRMED (Pay to driver)

👉 [Open Admin Panel](${adminUrl}/admin/dashboard)`)

      return NextResponse.json({
        success: true,
        requiresPayment: false,
        booking: { id: booking.id, bookingCode: booking.bookingCode },
        whatsappLink,
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

    const order = await razorpay.orders.create({
      amount: advanceAmount * 100,
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
