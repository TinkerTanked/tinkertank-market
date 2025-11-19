import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

const CreatePaymentIntentSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    productId: z.string(),
    quantity: z.number().min(1),
    totalPrice: z.number().min(0),
    students: z.array(z.object({
      id: z.string().optional(),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      age: z.number().min(1).max(99),
      parentName: z.string().min(1),
      parentEmail: z.string().email(),
      parentPhone: z.string().min(1),
      allergies: z.union([z.string(), z.array(z.string())]).optional(),
      medicalInfo: z.string().optional(),
    })),
    selectedDate: z.string().optional(),
    selectedTimeSlot: z.object({
      startTime: z.string(),
      endTime: z.string(),
    }).optional(),
    notes: z.string().optional(),
  })),
  customerInfo: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    address: z.object({
      line1: z.string().min(1),
      line2: z.string().optional(),
      city: z.string().min(1),
      state: z.string().min(1),
      postal_code: z.string().min(1),
      country: z.string().min(2).max(2).default('AU'),
    }),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreatePaymentIntentSchema.parse(body);

    // Validate products exist and calculate server-side totals
    const productIds = validatedData.items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'One or more products not found or inactive' },
        { status: 404 }
      );
    }

    // Calculate and validate totals server-side
    let serverTotal = 0;
    const orderItems = [];

    for (const item of validatedData.items) {
      const product = products.find(p => p.id === item.productId)!;
      const expectedTotal = Number(product.price) * item.quantity;
      
      // Validate client-provided total matches server calculation
      if (Math.abs(expectedTotal - item.totalPrice) > 0.01) {
        return NextResponse.json(
          { error: `Price mismatch for product ${product.name}` },
          { status: 400 }
        );
      }

      serverTotal += expectedTotal;
      
      // Prepare order items for database storage
      for (const student of item.students) {
        orderItems.push({
          productId: product.id,
          studentId: student.id || `temp-${Date.now()}-${Math.random()}`,
          studentData: student,
          bookingDate: item.selectedDate ? new Date(item.selectedDate) : null,
          timeSlot: item.selectedTimeSlot,
          price: Number(product.price),
          notes: item.notes,
        });
      }
    }

    // Add GST (10% in Australia)
    const subtotal = serverTotal;
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    // Get the app URL from environment or construct from request
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}`;

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Convert to cents
      currency: 'aud',
      customer: undefined, // We'll create customer on successful payment
      metadata: {
        orderItemCount: orderItems.length.toString(),
        customerEmail: validatedData.customerInfo.email,
        customerName: validatedData.customerInfo.name,
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
      },
      shipping: {
        name: validatedData.customerInfo.name,
        phone: validatedData.customerInfo.phone,
        address: {
          line1: validatedData.customerInfo.address.line1,
          line2: validatedData.customerInfo.address.line2 || undefined,
          city: validatedData.customerInfo.address.city,
          state: validatedData.customerInfo.address.state,
          postal_code: validatedData.customerInfo.address.postal_code,
          country: validatedData.customerInfo.address.country,
        },
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Create students first, then create order
    const createdStudents = [];
    for (const item of orderItems) {
      const student = await prisma.student.create({
        data: {
          name: `${item.studentData.firstName} ${item.studentData.lastName}`,
          birthdate: new Date(new Date().getFullYear() - item.studentData.age, 0, 1),
          allergies: Array.isArray(item.studentData.allergies) ? item.studentData.allergies.join(', ') : item.studentData.allergies || null,
        }
      });
      createdStudents.push({ ...item, actualStudentId: student.id });
    }

    // Create pending order in database
    const order = await prisma.order.create({
      data: {
        customerEmail: validatedData.customerInfo.email,
        customerName: validatedData.customerInfo.name,
        stripePaymentIntentId: paymentIntent.id,
        status: 'PENDING',
        totalAmount: total,
        orderItems: {
          create: createdStudents.map((item) => ({
            productId: item.productId,
            studentId: item.actualStudentId,
            bookingDate: item.bookingDate || new Date(),
            price: item.price,
          })),
        },
      },
      include: {
        orderItems: true,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
      paymentIntentId: paymentIntent.id,
      total: total,
      currency: 'aud',
    });

  } catch (error) {
    console.error('Create payment intent error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
