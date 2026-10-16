import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { config, middleware } from '@/middleware'

describe('admin authentication middleware', () => {
  const originalAdminUsername = process.env.ADMIN_USERNAME
  const originalAdminPassword = process.env.ADMIN_PASSWORD
  const originalSuperUsername = process.env.SUPER_ADMIN_USERNAME
  const originalSuperPassword = process.env.SUPER_ADMIN_PASSWORD

  const basic = (user: string, password: string) => ({
    Authorization: `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`
  })
  const mentor = basic('test-admin', 'test-password')
  const superAdmin = basic('test-super', 'super-password')

  beforeEach(() => {
    process.env.ADMIN_USERNAME = 'test-admin'
    process.env.ADMIN_PASSWORD = 'test-password'
    process.env.SUPER_ADMIN_USERNAME = 'test-super'
    process.env.SUPER_ADMIN_PASSWORD = 'super-password'
  })

  afterEach(() => {
    const restore = (key: string, value: string | undefined) => {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
    restore('ADMIN_USERNAME', originalAdminUsername)
    restore('ADMIN_PASSWORD', originalAdminPassword)
    restore('SUPER_ADMIN_USERNAME', originalSuperUsername)
    restore('SUPER_ADMIN_PASSWORD', originalSuperPassword)
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

  it('allows the super admin into every admin API', () => {
    const request = new NextRequest('https://tinkertank.rocks/api/admin/ignite-subscriptions', { headers: superAdmin })
    const response = middleware(request)

    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-next')).toBe('1')
  })

  it.each([
    ['GET', '/admin/schedule'],
    ['GET', '/admin/students/abc123'],
    ['GET', '/api/admin/schedule'],
    ['POST', '/api/admin/attendance'],
    ['PUT', '/api/admin/students/abc123']
  ])('lets mentors %s %s', (method, path) => {
    const response = middleware(new NextRequest(`https://tinkertank.rocks${path}`, { method, headers: mentor }))

    expect(response.headers.get('x-middleware-next')).toBe('1')
  })

  it.each([
    ['GET', '/api/admin/customers'],
    ['GET', '/api/admin/ignite-subscriptions'],
    ['POST', '/api/admin/ignite-subscriptions/sub_1/billing'],
    ['POST', '/api/admin/bookings/bk_1/move'],
    ['GET', '/api/admin/studentsexport'],
    ['DELETE', '/api/admin/students/abc123']
  ])('refuses mentors %s %s', (method, path) => {
    const response = middleware(new NextRequest(`https://tinkertank.rocks${path}`, { method, headers: mentor }))

    expect(response.status).toBe(403)
  })

  it.each(['/admin', '/admin/customers', '/admin/ignite-subscriptions'])('sends mentors from %s to check-in', path => {
    const response = middleware(new NextRequest(`https://tinkertank.rocks${path}`, { headers: mentor }))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://tinkertank.rocks/admin/schedule')
  })

  it('does not require admin credentials for public APIs', () => {
    expect(middleware(new NextRequest('https://tinkertank.rocks/api/health')).status).toBe(200)
  })
})
