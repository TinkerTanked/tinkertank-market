export interface CustomerOrderSource {
  customerEmail: string
  customerName: string
  customerPhone: string | null
  totalAmount: number
  createdAt: Date
  students: { id: string; name: string }[]
}

export interface CustomerSubscriptionSource {
  id: string
  customerEmail: string
  customerName: string | null
  status: string
  sessionName: string
  createdAt: Date
  students: { id: string; name: string }[]
}

export interface AdminCustomer {
  email: string
  name: string
  phone: string | null
  students: { id: string; name: string }[]
  orderCount: number
  totalSpent: number
  lastActivityAt: string
  activeSubscriptions: number
  subscriptions: { id: string; status: string; sessionName: string }[]
}

/**
 * There is no Customer table yet (planned with Cognito); a customer is the
 * set of paid orders and Ignite subscriptions sharing a case-insensitive email.
 * Only customers with at least one student are returned.
 */
export function buildAdminCustomers(orders: CustomerOrderSource[], subscriptions: CustomerSubscriptionSource[]): AdminCustomer[] {
  const customers = new Map<string, AdminCustomer & { studentMap: Map<string, string>; nameAt: number }>()

  const customerFor = (email: string) => {
    const key = email.trim().toLowerCase()
    let customer = customers.get(key)
    if (!customer) {
      customer = {
        email: key,
        name: '',
        phone: null,
        students: [],
        orderCount: 0,
        totalSpent: 0,
        lastActivityAt: new Date(0).toISOString(),
        activeSubscriptions: 0,
        subscriptions: [],
        studentMap: new Map(),
        nameAt: 0
      }
      customers.set(key, customer)
    }
    return customer
  }

  const touch = (customer: ReturnType<typeof customerFor>, at: Date, name: string | null, phone: string | null) => {
    // Most recent record wins for contact details.
    if (at.getTime() >= customer.nameAt) {
      if (name?.trim()) customer.name = name.trim()
      if (phone?.trim()) customer.phone = phone.trim()
      customer.nameAt = at.getTime()
    }
    if (at.toISOString() > customer.lastActivityAt) customer.lastActivityAt = at.toISOString()
  }

  for (const order of orders) {
    if (!order.customerEmail) continue
    const customer = customerFor(order.customerEmail)
    customer.orderCount++
    customer.totalSpent += order.totalAmount
    for (const student of order.students) customer.studentMap.set(student.id, student.name)
    touch(customer, order.createdAt, order.customerName, order.customerPhone)
  }

  for (const subscription of subscriptions) {
    if (!subscription.customerEmail) continue
    const customer = customerFor(subscription.customerEmail)
    customer.subscriptions.push({ id: subscription.id, status: subscription.status, sessionName: subscription.sessionName })
    if (subscription.status === 'ACTIVE' || subscription.status === 'TRIALING') customer.activeSubscriptions++
    for (const student of subscription.students) customer.studentMap.set(student.id, student.name)
    touch(customer, subscription.createdAt, subscription.customerName, null)
  }

  return [...customers.values()]
    .filter(customer => customer.studentMap.size > 0)
    .map(({ studentMap, nameAt: _nameAt, ...customer }) => ({
      ...customer,
      name: customer.name || customer.email,
      totalSpent: Math.round(customer.totalSpent * 100) / 100,
      students: [...studentMap].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
    }))
    .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt))
}
