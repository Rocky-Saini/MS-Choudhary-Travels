import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const now = new Date()
    const istOffset = 330
    const istNow = new Date(now.getTime() + (istOffset + now.getTimezoneOffset()) * 60000)
    const todayStart = new Date(istNow.getFullYear(), istNow.getMonth(), istNow.getDate())
    const todayStartUTC = new Date(todayStart.getTime() - istOffset * 60000)
    const tomorrowStartUTC = new Date(todayStartUTC.getTime() + 24 * 60 * 60 * 1000)

    const [todayTrips, totalVehicles, routes] = await Promise.all([
      prisma.trip.count({ where: { date: { gte: todayStartUTC, lt: tomorrowStartUTC }, status: { in: ['SCHEDULED', 'IN_PROGRESS'] } } }),
      prisma.vehicle.count({ where: { isActive: true } }),
      prisma.route.findFirst({ where: { isActive: true }, select: { fare: true } }),
    ])

    return NextResponse.json({
      todayTrips,
      totalVehicles,
      fare: routes?.fare || 350,
    })
  } catch {
    return NextResponse.json({ todayTrips: 0, totalVehicles: 0, fare: 350 })
  }
}
