import Stripe from 'stripe';
import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
});

async function checkStripeMetadata() {
  const paymentIntents = await stripe.paymentIntents.list({
    limit: 100,
  });

  console.log('Checking Stripe Payment Intents for location metadata...\n');

  const withLocation = paymentIntents.data.filter(pi => 
    pi.metadata && (pi.metadata.location || pi.metadata.locationId || pi.metadata.locationName)
  );

  if (withLocation.length > 0) {
    console.log(`✅ Found ${withLocation.length} payments with location metadata:\n`);
    
    withLocation.forEach(pi => {
      console.log(`Payment Intent: ${pi.id}`);
      console.log(`Amount: $${(pi.amount / 100).toFixed(2)}`);
      console.log(`Status: ${pi.status}`);
      console.log(`Metadata:`, pi.metadata);
      console.log('');
    });
  } else {
    console.log('❌ No payment intents have location metadata stored');
    console.log('\nThis means location was not saved to Stripe during checkout.');
    console.log('The booking flow needs to be updated to save location to Stripe metadata.\n');
  }

  // Sample a few to show what metadata exists
  console.log('\nSample metadata from recent payments:');
  paymentIntents.data.slice(0, 5).forEach(pi => {
    console.log(`\n${pi.id} - $${(pi.amount / 100).toFixed(2)}`);
    console.log('  Metadata:', Object.keys(pi.metadata).length > 0 ? pi.metadata : 'empty');
  });
}

checkStripeMetadata();
