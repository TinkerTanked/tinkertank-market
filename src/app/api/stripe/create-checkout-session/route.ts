import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

const CreateCheckoutSessionSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1),
    students: z.array(z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      age: z.number().min(1).max(99),
      parentName: z.string().min(1),
      parentEmail: z.string().email(),
      parentPhone: z.string().min(1),
      allergies: z.union([z.string(), z.array(z.string())]).optional(),
    })),
    selectedDate: z.string().optional(),
    selectedDates: z.array(z.string()).optional(),
    isSubscription: z.boolean().optional(),
    stripePriceId: z.string().optional(),
    productName: z.string().optional(),
    productPrice: z.number().optional(),
  })),
  customerInfo: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
  }),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Checkout session request:', JSON.stringify(body, null, 2))
    const validatedData = CreateCheckoutSessionSchema.parse(body)

    // Separate subscription items from regular items
    const subscriptionItems = validatedData.items.filter(item => item.isSubscription && item.stripePriceId)
    const regularItems = validatedData.items.filter(item => !item.isSubscription || !item.stripePriceId)

    // Fetch products from database for regular items only
    const productIds = regularItems.map(item => item.productId)
    const products = productIds.length > 0 ? await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    }) : []

    if (regularItems.length > 0 && products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'One or more products not found or inactive' },
        { status: 404 }
      )
    }

    let subtotal = 0
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
    const orderItems = []

    // Handle subscription items (Ignite) - use Stripe price ID directly
    const subscriptionStudents: Array<{
      firstName: string
      lastName: string
      age: number
      allergies?: string | string[]
    }> = []
    
    for (const item of subscriptionItems) {
      const unitPrice = item.productPrice || 0
      subtotal += unitPrice * item.quantity

      // Use the existing Stripe price for subscriptions
      lineItems.push({
        price: item.stripePriceId,
        quantity: item.quantity,
      })

      // Collect student info for subscriptions
      for (const student of item.students) {
        subscriptionStudents.push(student)
      }
    }

    // Handle regular items (camps, birthdays)
    for (const item of regularItems) {
      const product = products.find(p => p.id === item.productId)!
      const unitPrice = Number(product.price)
      const numberOfDays = item.selectedDates?.length || 1
      const numberOfStudents = item.students.length
      const quantity = numberOfDays * numberOfStudents
      
      subtotal += unitPrice * quantity

      lineItems.push({
        price_data: {
          currency: 'aud',
          product_data: {
            name: numberOfDays > 1 ? `${product.name} (${numberOfDays} days)` : product.name,
            description: product.description,
          },
          unit_amount: Math.round(unitPrice * 100),
        },
        quantity,
      })

      for (const student of item.students) {
        const createdStudent = await prisma.student.create({
          data: {
            name: `${student.firstName} ${student.lastName}`,
            birthdate: new Date(new Date().getFullYear() - student.age, 0, 1),
            allergies: Array.isArray(student.allergies) ? student.allergies.join(', ') : student.allergies || null,
          }
        })

        let bookingDate: Date
        if (item.selectedDate && item.selectedDate !== 'undefined') {
          bookingDate = item.selectedDate.includes('T') 
            ? new Date(item.selectedDate)
            : new Date(item.selectedDate + 'T00:00:00.000Z')
        } else if (item.selectedDates && item.selectedDates.length > 0 && item.selectedDates[0] !== 'undefined') {
          const firstDate = item.selectedDates[0]
          bookingDate = firstDate.includes('T')
            ? new Date(firstDate)
            : new Date(firstDate + 'T00:00:00.000Z')
        } else {
          console.error('No valid date provided for booking:', { selectedDate: item.selectedDate, selectedDates: item.selectedDates })
          throw new Error('Valid booking date is required')
        }
        
        orderItems.push({
          productId: product.id,
          studentId: createdStudent.id,
          bookingDate,
          price: unitPrice,
        })
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get('host')}`

    // Determine checkout mode based on item types
    const hasSubscriptions = subscriptionItems.length > 0
    const hasRegularItems = regularItems.length > 0

    // Stripe doesn't allow mixing subscription and one-time items in the same session
    if (hasSubscriptions && hasRegularItems) {
      return NextResponse.json(
        { error: 'Cannot mix subscription and one-time items in the same checkout. Please complete them separately.' },
        { status: 400 }
      )
    }

    const checkoutMode = hasSubscriptions ? 'subscription' : 'payment'

    // Only create order with items for regular purchases
    // Subscriptions are handled via webhook after payment
    const order = await prisma.order.create({
      data: {
        customerEmail: validatedData.customerInfo.email,
        customerName: validatedData.customerInfo.name,
        status: 'PENDING',
        totalAmount: subtotal,
        stripePaymentIntentId: null,
        orderItems: orderItems.length > 0 ? {
          create: orderItems,
        } : undefined,
      },
    })

    // Build session metadata
    const metadata: Record<string, string> = {
      orderId: order.id,
      customerName: validatedData.customerInfo.name,
      customerPhone: validatedData.customerInfo.phone,
    }

    // For subscriptions, include session details in metadata for webhook processing
    if (hasSubscriptions && subscriptionItems[0]) {
      metadata.isSubscription = 'true'
      metadata.subscriptionProductId = subscriptionItems[0].productId
      metadata.subscriptionPriceId = subscriptionItems[0].stripePriceId || ''
      // Store student info as JSON in metadata (Stripe allows up to 500 chars per value)
      if (subscriptionStudents.length > 0) {
        metadata.studentInfo = JSON.stringify(subscriptionStudents.map(s => ({
          firstName: s.firstName,
          lastName: s.lastName,
          age: s.age,
          allergies: Array.isArray(s.allergies) ? s.allergies.join(', ') : s.allergies || ''
        })))
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: checkoutMode,
      line_items: lineItems,
      customer_email: validatedData.customerInfo.email,
      client_reference_id: order.id,
      metadata,
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${appUrl}/checkout?canceled=true`,
    })

    await prisma.order.update({
      where: { id: order.id },
      data: { stripePaymentIntentId: session.id },
    })

    return NextResponse.json({
      sessionId: session.id,
      orderId: order.id,
      url: session.url,
    })
  } catch (error) {
    console.error('Create checkout session error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
