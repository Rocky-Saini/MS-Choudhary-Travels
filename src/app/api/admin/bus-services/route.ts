import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function getToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  return authHeader?.replace('Bearer ', '') || null
}

export async function GET(request: NextRequest) {
  const token = getToken(request)
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const services = await prisma.busService.findMany({ orderBy: { createdAt: 'asc' } })
    return NextResponse.json({ services })
  } catch {
    return NextResponse.json({ services: [] })
  }
}

export async function POST(request: NextRequest) {
  const token = getToken(request)
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const service = await prisma.busService.create({ data: body })
    return NextResponse.json({ success: true, service })
  } catch (error) {
    console.error('Error creating bus service:', error)
    return NextResponse.json({ error: 'Failed to create bus service' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const token = getToken(request)
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, ...data } = body
    const service = await prisma.busService.update({ where: { id }, data })
    return NextResponse.json({ success: true, service })
  } catch (error) {
    console.error('Error updating bus service:', error)
    return NextResponse.json({ error: 'Failed to update bus service' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const token = getToken(request)
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await prisma.busService.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting bus service:', error)
    return NextResponse.json({ error: 'Failed to delete bus service' }, { status: 500 })
  }
}
