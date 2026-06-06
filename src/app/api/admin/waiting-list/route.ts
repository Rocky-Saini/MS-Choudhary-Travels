import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function getToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  return authHeader?.replace('Bearer ', '') || null
}

// View waiting list (admin OR driver)
export async function GET(request: NextRequest) {
  const token = getToken(request)
  const decoded = token ? verifyToken(token) : null
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')

    // Auto-cleanup: remove waiting entries whose date has passed (older than today)
    const now = new Date()
    const istOffset = 330
    const istNow = new Date(now.getTime() + (istOffset + now.getTimezoneOffset()) * 60000)
    const todayStart = new Date(istNow.getFullYear(), istNow.getMonth(), istNow.getDate())
    const todayStartUTC = new Date(todayStart.getTime() - istOffset * 60000)
    await prisma.waitingList.deleteMany({
      where: { status: 'WAITING', date: { lt: todayStartUTC } },
    })

    const where: Record<string, unknown> = { status: 'WAITING' }

    if (dateParam) {
      const [year, month, day] = dateParam.split('-').map(Number)
      const istOffset = 330
      const dayStart = new Date(Date.UTC(year, month - 1, day))
      dayStart.setMinutes(dayStart.getMinutes() - istOffset)
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
      where.date = { gte: dayStart, lt: dayEnd }
    }

    const entries = await prisma.waitingList.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    })

    // Attach route info
    const routes = await prisma.route.findMany()
    const routeMap = Object.fromEntries(routes.map(r => [r.id, `${r.origin} → ${r.destination}`]))

    const formatted = entries.map(e => ({
      ...e,
      route: routeMap[e.routeId] || e.routeId,
      routeId: e.routeId,
      preferredTime: e.preferredTime || '',
      dateStr: e.date.toISOString().split('T')[0],
    }))

    return NextResponse.json({ entries: formatted })
  } catch (error) {
    console.error('Error fetching waiting list:', error)
    return NextResponse.json({ error: 'Failed to fetch waiting list' }, { status: 500 })
  }
}

// Admin updates status (e.g. mark CONFIRMED / REMOVED)
export async function PUT(request: NextRequest) {
  const token = getToken(request)
  const decoded = token ? verifyToken(token) : null
  if (!decoded || decoded.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id, status } = await request.json()
    const entry = await prisma.waitingList.update({ where: { id }, data: { status } })
    return NextResponse.json({ success: true, entry })
  } catch (error) {
    console.error('Error updating waiting list:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const token = getToken(request)
  const decoded = token ? verifyToken(token) : null
  if (!decoded || decoded.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await prisma.waitingList.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting waiting list:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
