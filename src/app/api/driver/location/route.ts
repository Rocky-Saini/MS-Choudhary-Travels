import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function getToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  return authHeader?.replace('Bearer ', '') || null
}

// Driver updates location
export async function POST(request: NextRequest) {
  const token = getToken(request)
  const decoded = token ? verifyToken(token) : null
  if (!decoded || decoded.role !== 'driver') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { latitude, longitude, heading, speed } = await request.json()

    await prisma.liveLocation.create({
      data: {
        driverId: decoded.id,
        latitude,
        longitude,
        heading,
        speed,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Location update error:', error)
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 })
  }
}

// Get driver's latest location (for passengers)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const driverId = searchParams.get('driverId')

    if (!driverId) {
      return NextResponse.json({ error: 'Driver ID required' }, { status: 400 })
    }

    const location = await prisma.liveLocation.findFirst({
      where: { driverId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ location })
  } catch (error) {
    console.error('Error fetching location:', error)
    return NextResponse.json({ error: 'Failed to fetch location' }, { status: 500 })
  }
}
