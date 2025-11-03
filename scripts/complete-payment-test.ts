#!/usr/bin/env tsx

/**
 * Complete End-to-End Stripe Payment Test
 * 
 * This script demonstrates a complete payment flow:
 * 1. Creates a PaymentIntent for $85.00 AUD (day camp)
 * 2. Creates a PaymentMethod with test card 4242 4242 4242 4242
 * 3. Confirms the payment
 * 4. Creates a booking record in the database
 * 
 * The payment will appear in Stripe Dashboard and booking in database.
 */

import 'dotenv/config';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY environment variable is required');
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
});

const prisma = new PrismaClient();

const AMOUNT = 8500; // $85.00 AUD (day camp)
const CURRENCY = 'aud';

// Use Stripe test token for card 4242 4242 4242 4242
// This is the recommended way to test card payments via the API
const TEST_PAYMENT_METHOD_TOKEN = 'pm_card_visa';

async function completePaymentTest() {
  try {
    console.log('🧪 Complete End-to-End Stripe Payment Test');
    console.log('='.repeat(50));
    console.log();

    // Step 1: Get required database records
    console.log('📋 Step 1: Fetching database records...');
    
    const location = await prisma.location.findFirst({
      where: { isActive: true },
    });
    
    if (!location) {
      throw new Error('No active location found. Please run: npm run db:seed');
    }

    const product = await prisma.product.findFirst({
      where: {
        type: 'CAMP',
        isActive: true,
        price: 85,
      },
    });

    if (!product) {
      throw new Error('No day camp product ($85) found. Please run: npm run db:seed');
    }

    const student = await prisma.student.findFirst();

    if (!student) {
      throw new Error('No student found. Please run: npm run db:seed');
    }

    console.log(`   ✓ Location: ${location.name}`);
    console.log(`   ✓ Product: ${product.name} ($${product.price})`);
    console.log(`   ✓ Student: ${student.name}`);
    console.log();

    // Step 2: Create PaymentIntent
    console.log('💳 Step 2: Creating Stripe PaymentIntent...');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: AMOUNT,
      currency: CURRENCY,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      metadata: {
        test: 'true',
        product: product.name,
        student: student.name,
        location: location.name,
      },
      description: `Test Booking: ${product.name} for ${student.name}`,
    });

    console.log(`   ✓ PaymentIntent ID: ${paymentIntent.id}`);
    console.log(`   ✓ Amount: $${(paymentIntent.amount / 100).toFixed(2)} ${CURRENCY.toUpperCase()}`);
    console.log(`   ✓ Status: ${paymentIntent.status}`);
    console.log();

    // Step 3: Attach test PaymentMethod
    console.log('💳 Step 3: Using Stripe test PaymentMethod...');
    console.log(`   Using test token: ${TEST_PAYMENT_METHOD_TOKEN}`);
    console.log(`   This represents card: 4242 4242 4242 4242`);
    console.log(`   Exp: 12/2025, CVC: 123`);
    console.log();

    // Step 4: Confirm the payment
    console.log('✅ Step 4: Confirming payment...');
    const confirmedPayment = await stripe.paymentIntents.confirm(paymentIntent.id, {
      payment_method: TEST_PAYMENT_METHOD_TOKEN,
    });

    console.log(`   ✓ Payment Status: ${confirmedPayment.status}`);
    
    if (confirmedPayment.status !== 'succeeded') {
      throw new Error(`Payment failed with status: ${confirmedPayment.status}`);
    }

    console.log(`   ✓ Payment succeeded!`);
    console.log();

    // Step 5: Create booking in database
    console.log('📅 Step 5: Creating booking in database...');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7); // Book for next week
    startDate.setHours(9, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setHours(17, 0, 0, 0); // 8 hours later (full day camp)

    // Create order first
    const order = await prisma.order.create({
      data: {
        customerEmail: 'test@example.com',
        customerName: 'Test Parent',
        stripePaymentIntentId: paymentIntent.id,
        status: 'PAID',
        totalAmount: Number(product.price),
      },
    });

    console.log(`   ✓ Order created: ${order.id}`);

    // Create order item
    const orderItem = await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: product.id,
        studentId: student.id,
        bookingDate: startDate,
        price: product.price,
      },
    });

    console.log(`   ✓ OrderItem created: ${orderItem.id}`);

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        studentId: student.id,
        productId: product.id,
        locationId: location.id,
        startDate,
        endDate,
        status: 'CONFIRMED',
        totalPrice: product.price,
        notes: `Test booking created via complete-payment-test script. Order: ${order.id}, Payment: ${paymentIntent.id}`,
      },
    });

    console.log(`   ✓ Booking created: ${booking.id}`);
    console.log(`   ✓ Booking date: ${startDate.toLocaleDateString()}`);
    console.log();

    // Final Summary
    console.log('🎉 Complete Payment Flow Successful!');
    console.log('='.repeat(50));
    console.log();
    console.log('📊 Summary:');
    console.log(`   Payment ID:       ${paymentIntent.id}`);
    console.log(`   Order ID:         ${order.id}`);
    console.log(`   Booking ID:       ${booking.id}`);
    console.log(`   Amount Paid:      $${(paymentIntent.amount / 100).toFixed(2)} ${CURRENCY.toUpperCase()}`);
    console.log(`   Student:          ${student.name}`);
    console.log(`   Product:          ${product.name}`);
    console.log(`   Location:         ${location.name}`);
    console.log(`   Booking Date:     ${startDate.toLocaleDateString()}`);
    console.log();
    console.log('🔗 View in Stripe Dashboard:');
    console.log(`   https://dashboard.stripe.com/test/payments/${paymentIntent.id}`);
    console.log();
    console.log('✅ This payment is now visible in:');
    console.log('   1. Stripe Dashboard (as a successful test payment)');
    console.log('   2. Your database (orders, order_items, and bookings tables)');
    console.log();

  } catch (error) {
    console.error();
    console.error('❌ Error during payment test:');
    console.error(error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
completePaymentTest()
  .then(() => {
    console.log('✓ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ Test failed');
    process.exit(1);
  });
