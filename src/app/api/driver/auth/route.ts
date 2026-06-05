import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { mobile, password } = await request.json()

    const driver = await prisma.driver.findUnique({ where: { mobile } })
    if (!driver) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const isValid = await verifyPassword(password, driver.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = generateToken({ id: driver.id, role: 'driver' })

    return NextResponse.json({ success: true, token, driver: { id: driver.id, name: driver.name, mobile: driver.mobile } })
  } catch (error) {
    console.error('Driver auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
