'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import type { AdminCustomer } from '@/lib/adminCustomers'

type Filter = 'all' | 'subscribers' | 'camps'

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Sydney' })
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    fetch('/api/admin/customers')
      .then(response => response.json())
      .then(data => setCustomers(data.customers || []))
      .finally(() => setLoading(false))
  }, [])

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase()
    return customers.filter(customer =>
      (filter === 'all' || (filter === 'subscribers' ? customer.activeSubscriptions > 0 : customer.orderCount > 0)) &&
      (!query ||
        customer.name.toLowerCase().includes(query) ||
        customer.email.includes(query) ||
        (customer.phone || '').replace(/\s/g, '').includes(query.replace(/\s/g, '')) ||
        customer.students.some(student => student.name.toLowerCase().includes(query)))
    )
  }, [customers, search, filter])

  const filters: { value: Filter; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: customers.length },
    { value: 'subscribers', label: 'Active Ignite', count: customers.filter(c => c.activeSubscriptions > 0).length },
    { value: 'camps', label: 'Camps & parties', count: customers.filter(c => c.orderCount > 0).length }
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Customers</h1>
        <p className="text-sm text-gray-500">Families with children enrolled in camps, parties or Ignite.</p>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {filters.map(item => (
          <button
            key={item.value}
            onClick={() => setFilter(item.value)}
            className={clsx(
              'flex-shrink-0 whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-medium',
              filter === item.value ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 bg-white text-gray-700'
            )}
          >
            {item.label}<span className="ml-1.5 opacity-70">{item.count}</span>
          </button>
        ))}
      </div>

      <label className="relative block">
        <span className="sr-only">Search customers</span>
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search parent, email, phone or child"
          className="h-12 w-full rounded-xl border border-gray-300 bg-white pl-11 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </label>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-orange-600" />
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">No customers match.</div>
      ) : (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {visible.map(customer => (
            <li key={customer.email}>
              <Link href={`/admin/customers/${encodeURIComponent(customer.email)}`} className="flex items-center gap-3 p-4 hover:bg-gray-50">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-semibold text-gray-900">{customer.name}</span>
                    {customer.activeSubscriptions > 0 && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        Ignite{customer.activeSubscriptions > 1 ? ` ×${customer.activeSubscriptions}` : ''}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-gray-700">{customer.students.map(student => student.name).join(', ')}</div>
                  <div className="mt-1 truncate text-xs text-gray-500">
                    {customer.email}
                    {customer.phone && ` · ${customer.phone}`}
                    {` · Last activity ${formatDate(customer.lastActivityAt)}`}
                  </div>
                </div>
                <ChevronRightIcon className="h-5 w-5 flex-shrink-0 text-gray-400" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
