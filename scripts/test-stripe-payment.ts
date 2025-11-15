#!/usr/bin/env tsx

/**
 * Test Script: Create Real Stripe Payment Intent
 * 
 * This script creates actual payment intents in Stripe test mode
 * to verify the payment flow is working correctly.
 */

import 'dotenv/config';
import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY environment variable is required');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
});

async function createTestPayment() {
  console.log('🔧 Creating test payment intent...\n');

  try {
    // Get app URL from environment
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Create a payment intent with return_url
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 8500, // $85.00 for a day camp
      currency: 'aud',
      automatic_payment_methods: {
        enabled: true,
      },
      return_url: `${appUrl}/checkout/success`,
      metadata: {
        test: 'true',
        product: 'Day Camp',
        date: new Date().toISOString(),
      },
      description: 'Test Day Camp Booking - STEM Day Camp',
    });

    console.log('✅ Payment Intent Created!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Payment Intent ID: ${paymentIntent.id}`);
    console.log(`Amount: $${(paymentIntent.amount / 100).toFixed(2)} ${paymentIntent.currency.toUpperCase()}`);
    console.log(`Status: ${paymentIntent.status}`);
    console.log(`Client Secret: ${paymentIntent.client_secret}`);
    console.log(`Return URL: ${appUrl}/checkout/success`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // You can view this in your Stripe Dashboard
    console.log('🔗 View in Stripe Dashboard:');
    console.log(`https://dashboard.stripe.com/test/payments/${paymentIntent.id}\n`);

    // Important note about using Stripe Elements
    console.log('⚠️  IMPORTANT: Use Stripe Elements for Payment');
    console.log('To complete this payment, use the checkout page in your app:');
    console.log(`${appUrl}/checkout`);
    console.log('\nNever send raw card numbers to the API. Use Stripe.js/Elements.');
    console.log('\n💳 Test with these cards in Stripe Elements:');
    console.log('Success: 4242 4242 4242 4242');
    console.log('Declined: 4000 0000 0000 0002');
    console.log('Requires Authentication: 4000 0025 0000 3155\n');

    return paymentIntent;
  } catch (error) {
    console.error('❌ Error creating payment intent:', error);
    throw error;
  }
}

async function listRecentPayments() {
  console.log('📋 Fetching recent payment intents...\n');

  try {
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 5,
    });

    if (paymentIntents.data.length === 0) {
      console.log('No payment intents found.');
      return;
    }

    console.log(`Found ${paymentIntents.data.length} recent payment(s):\n`);
    
    paymentIntents.data.forEach((pi, index) => {
      console.log(`${index + 1}. ${pi.id}`);
      console.log(`   Amount: $${(pi.amount / 100).toFixed(2)} ${pi.currency.toUpperCase()}`);
      console.log(`   Status: ${pi.status}`);
      console.log(`   Created: ${new Date(pi.created * 1000).toLocaleString()}`);
      console.log(`   Description: ${pi.description || 'N/A'}`);
      console.log();
    });
  } catch (error) {
    console.error('❌ Error listing payments:', error);
    throw error;
  }
}

async function main() {
  console.log('🧪 Stripe Payment Test Script');
  console.log('================================\n');

  const command = process.argv[2];

  if (command === 'list') {
    await listRecentPayments();
  } else if (command === 'create' || !command) {
    await createTestPayment();
  } else {
    console.log('Usage:');
    console.log('  npm run test:stripe         # Create a test payment');
    console.log('  npm run test:stripe create  # Create a test payment');
    console.log('  npm run test:stripe list    # List recent payments');
  }
}

main().catch(console.error);
