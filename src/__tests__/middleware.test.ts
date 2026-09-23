import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { config, middleware } from '@/middleware'

describe('admin authentication middleware', () => {
  const originalAdminUsername = process.env.ADMIN_USERNAME
  const originalAdminPassword = process.env.ADMIN_PASSWORD

  beforeEach(() => {
    process.env.ADMIN_USERNAME = 'test-admin'
    process.env.ADMIN_PASSWORD = 'test-password'
  })

  afterEach(() => {
    if (originalAdminUsername === undefined) delete process.env.ADMIN_USERNAME
    else process.env.ADMIN_USERNAME = originalAdminUsername
    if (originalAdminPassword === undefined) delete process.env.ADMIN_PASSWORD
    else process.env.ADMIN_PASSWORD = originalAdminPassword
  })

  it('matches both admin pages and admin API routes', () => {
    expect(config.matcher).toEqual(['/admin/:path*', '/api/admin/:path*'])
  })

  it.each(['/admin', '/api/admin/ignite-subscriptions'])('rejects unauthenticated access to %s', path => {
    const response = middleware(new NextRequest(`https://tinkertank.rocks${path}`))

    expect(response.status).toBe(401)
    expect(response.headers.get('WWW-Authenticate')).toBe('Basic realm="Admin Area"')
  })

  it('rejects invalid credentials for admin APIs', () => {
    const request = new NextRequest('https://tinkertank.rocks/api/admin/ignite-subscriptions', {
      headers: { Authorization: `Basic ${Buffer.from('test-admin:wrong-password').toString('base64')}` }
    })

    expect(middleware(request).status).toBe(401)
  })

  it('fails closed when admin credentials are not configured', () => {
    delete process.env.ADMIN_USERNAME
    delete process.env.ADMIN_PASSWORD

    expect(middleware(new NextRequest('https://tinkertank.rocks/api/admin/ignite-subscriptions')).status).toBe(503)
  })

  it('allows valid credentials through to admin APIs', () => {
    const request = new NextRequest('https://tinkertank.rocks/api/admin/ignite-subscriptions', {
      headers: { Authorization: `Basic ${Buffer.from('test-admin:test-password').toString('base64')}` }
    })
    const response = middleware(request)

    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-next')).toBe('1')
  })

  it('does not require admin credentials for public APIs', () => {
    expect(middleware(new NextRequest('https://tinkertank.rocks/api/health')).status).toBe(200)
  })
})
