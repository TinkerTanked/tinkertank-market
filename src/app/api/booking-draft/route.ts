import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { CampBookingDraftSchema } from '@/lib/bookingSchema'
import { prisma } from '@/lib/prisma'

const COOKIE_NAME = 'tinkertank-booking-draft'
const DRAFT_LIFETIME_MS = 24 * 60 * 60 * 1000

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function setDraftCookie(response: NextResponse, id: string, token: string) {
  response.cookies.set(COOKIE_NAME, `${id}.${token}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: DRAFT_LIFETIME_MS / 1000,
  })
}

function clearDraftCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

function parseDraftCookie(request: NextRequest) {
  const value = request.cookies.get(COOKIE_NAME)?.value
  if (!value) return null

  const separator = value.indexOf('.')
  if (separator < 1) return null
  return { id: value.slice(0, separator), token: value.slice(separator + 1) }
}

async function getAuthenticatedDraft(request: NextRequest) {
  const credentials = parseDraftCookie(request)
  if (!credentials) return null

  const draft = await prisma.bookingDraft.findUnique({ where: { id: credentials.id } })
  if (!draft) return null
  if (draft.expiresAt <= new Date()) {
    await prisma.bookingDraft.delete({ where: { id: draft.id } })
    return null
  }

  const actual = Buffer.from(draft.tokenHash, 'hex')
  const supplied = Buffer.from(hashToken(credentials.token), 'hex')
  if (actual.length !== supplied.length || !timingSafeEqual(actual, supplied)) return null

  return { draft, token: credentials.token }
}

export async function GET(request: NextRequest) {
  const authenticated = await getAuthenticatedDraft(request)
  if (!authenticated) {
    const response = NextResponse.json({ draft: null }, { status: 404 })
    clearDraftCookie(response)
    return response
  }

  const parsed = CampBookingDraftSchema.safeParse(authenticated.draft.payload)
  if (!parsed.success) {
    await prisma.bookingDraft.delete({ where: { id: authenticated.draft.id } })
    const response = NextResponse.json({ draft: null }, { status: 404 })
    clearDraftCookie(response)
    return response
  }

  return NextResponse.json({ draft: parsed.data })
}

export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = CampBookingDraftSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid booking draft' }, { status: 400 })
  }

  const expiresAt = new Date(Date.now() + DRAFT_LIFETIME_MS)
  const authenticated = await getAuthenticatedDraft(request)

  if (authenticated) {
    await prisma.bookingDraft.update({
      where: { id: authenticated.draft.id },
      data: {
        payload: parsed.data as Prisma.InputJsonValue,
        expiresAt,
      },
    })
    const response = NextResponse.json({ saved: true })
    setDraftCookie(response, authenticated.draft.id, authenticated.token)
    return response
  }

  await prisma.bookingDraft.deleteMany({ where: { expiresAt: { lte: new Date() } } })
  const token = randomBytes(32).toString('base64url')
  const draft = await prisma.bookingDraft.create({
    data: {
      tokenHash: hashToken(token),
      kind: 'camp',
      payload: parsed.data as Prisma.InputJsonValue,
      expiresAt,
    },
  })

  const response = NextResponse.json({ saved: true }, { status: 201 })
  setDraftCookie(response, draft.id, token)
  return response
}

export async function DELETE(request: NextRequest) {
  const authenticated = await getAuthenticatedDraft(request)
  if (authenticated) {
    await prisma.bookingDraft.delete({ where: { id: authenticated.draft.id } })
  }

  const response = NextResponse.json({ deleted: true })
  clearDraftCookie(response)
  return response
}
