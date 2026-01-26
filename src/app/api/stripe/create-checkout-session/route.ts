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

    const productIds = validatedData.items.map(item => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    })

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'One or more products not found or inactive' },
        { status: 404 }
      )
    }

    let subtotal = 0
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
    const orderItems = []

    for (const item of validatedData.items) {
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
          // If already ISO string with time, use as-is. Otherwise append time.
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

    const order = await prisma.order.create({
      data: {
        customerEmail: validatedData.customerInfo.email,
        customerName: validatedData.customerInfo.name,
        status: 'PENDING',
        totalAmount: subtotal,
        stripePaymentIntentId: null,
        orderItems: {
          create: orderItems,
        },
      },
    })

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      customer_email: validatedData.customerInfo.email,
      client_reference_id: order.id,
      metadata: {
        orderId: order.id,
        customerName: validatedData.customerInfo.name,
        customerPhone: validatedData.customerInfo.phone,
      },
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
