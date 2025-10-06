import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get global 2FA setting from database settings table
    const setting = await prisma.setting.findUnique({ where: { key: 'global_2fa_enabled' } })
    const enabled = setting?.value === 'true'
    
    return NextResponse.json({ enabled })
  } catch (error) {
    console.error('2FA global status error:', error)
    // Return default value if database error occurs
    return NextResponse.json({ enabled: false })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { enabled } = await req.json()
    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid enabled value' }, { status: 400 })
    }

    // Update global 2FA setting
    await prisma.setting.upsert({
      where: { key: 'global_2fa_enabled' },
      update: { value: enabled.toString() },
      create: { key: 'global_2fa_enabled', value: enabled.toString() }
    })

    return NextResponse.json({ success: true, enabled })
  } catch (error) {
    console.error('2FA global update error:', error)
    return NextResponse.json({ error: 'Failed to update 2FA setting' }, { status: 500 })
  }
}

