import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateTOTPSecret, generateTOTPQrDataUrl, verifyTOTPToken } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { secret, otpauthUrl } = generateTOTPSecret(user.email)
  const qrDataUrl = await generateTOTPQrDataUrl(otpauthUrl)

  await prisma.user.update({ where: { id: user.id }, data: { twoFactorSecret: secret, twoFactorEnabled: false } })

  return NextResponse.json({ otpauthUrl, qrDataUrl })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { token } = await req.json()
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user || !user.twoFactorSecret) return NextResponse.json({ error: 'Setup not initiated' }, { status: 400 })

  const ok = verifyTOTPToken(user.twoFactorSecret, token)
  if (!ok) return NextResponse.json({ error: 'Invalid token' }, { status: 400 })

  await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true } })
  return NextResponse.json({ success: true })
}

export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: false, twoFactorSecret: null } })
  return NextResponse.json({ success: true })
}
