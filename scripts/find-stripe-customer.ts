import Stripe from 'stripe';
import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
});

async function findCustomer(phone: string, amount?: number) {
  try {
    console.log(`🔍 Searching for customer with phone: ${phone}`);
    
    const phoneVariations = [
      phone,
      phone.replace(/\s/g, ''),
      phone.replace(/[^\d+]/g, ''),
      '+61410341673',
      '61410341673',
      '0410341673',
    ];

    let customers: Stripe.ApiSearchResult<Stripe.Customer> | null = null;

    for (const phoneVar of phoneVariations) {
      console.log(`  Trying: ${phoneVar}`);
      const result = await stripe.customers.search({
        query: `phone:'${phoneVar}'`,
      });
      if (result.data.length > 0) {
        customers = result;
        console.log(`  ✅ Found with: ${phoneVar}`);
        break;
      }
    }

    if (!customers || customers.data.length === 0) {
      console.log('❌ No customers found with any phone variation');
      console.log('\n🔍 Searching by payment amount instead...');
      
      const charges = await stripe.charges.list({
        limit: 100,
      });

      const matchingCharges = charges.data.filter(c => c.amount === amount! * 100);
      
      if (matchingCharges.length > 0) {
        console.log(`\nFound ${matchingCharges.length} charge(s) for $${amount}:\n`);
        for (const charge of matchingCharges) {
          console.log(`Charge ID: ${charge.id}`);
          console.log(`Amount: $${(charge.amount / 100).toFixed(2)}`);
          console.log(`Status: ${charge.status}`);
          console.log(`Customer: ${charge.customer || 'N/A'}`);
          console.log(`Date: ${new Date(charge.created * 1000).toLocaleString()}`);
          console.log(`Receipt Email: ${charge.receipt_email || 'N/A'}`);
          
          if (charge.customer) {
            const customer = await stripe.customers.retrieve(charge.customer as string);
            if ('deleted' in customer && customer.deleted) {
              console.log(`Customer: DELETED`);
            } else {
              console.log(`Customer Name: ${customer.name || 'N/A'}`);
              console.log(`Customer Email: ${customer.email || 'N/A'}`);
              console.log(`Customer Phone: ${customer.phone || 'N/A'}`);
            }
          }
          console.log('\n' + '-'.repeat(80) + '\n');
        }
      } else {
        console.log('❌ No charges found for that amount either');
      }
      return;
    }

    console.log(`\n✅ Found ${customers.data.length} customer(s):\n`);

    for (const customer of customers.data) {
      console.log(`Customer ID: ${customer.id}`);
      console.log(`Name: ${customer.name || 'N/A'}`);
      console.log(`Email: ${customer.email || 'N/A'}`);
      console.log(`Phone: ${customer.phone || 'N/A'}`);
      console.log(`Created: ${new Date(customer.created * 1000).toLocaleString()}`);

      const charges = await stripe.charges.list({
        customer: customer.id,
        limit: 10,
      });

      console.log(`\nCharges (${charges.data.length}):`);
      for (const charge of charges.data) {
        const chargeAmount = charge.amount / 100;
        const match = amount ? chargeAmount === amount : true;
        const marker = match ? '💰' : '  ';
        console.log(`${marker} $${chargeAmount.toFixed(2)} - ${charge.status} - ${new Date(charge.created * 1000).toLocaleString()} - ${charge.id}`);
      }

      const paymentIntents = await stripe.paymentIntents.list({
        customer: customer.id,
        limit: 10,
      });

      console.log(`\nPayment Intents (${paymentIntents.data.length}):`);
      for (const pi of paymentIntents.data) {
        const piAmount = pi.amount / 100;
        const match = amount ? piAmount === amount : true;
        const marker = match ? '💰' : '  ';
        console.log(`${marker} $${piAmount.toFixed(2)} - ${pi.status} - ${new Date(pi.created * 1000).toLocaleString()} - ${pi.id}`);
      }

      console.log('\n' + '='.repeat(80) + '\n');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function inspectChargeDetails() {
  const charges = await stripe.charges.list({ limit: 100 });
  const dec31Charges = charges.data.filter(c => {
    const date = new Date(c.created * 1000);
    return c.amount === 21998 && date < new Date('2025-12-31');
  });

  console.log(`\nFound ${dec31Charges.length} charges for $219.98 before Dec 31:\n`);

  for (const charge of dec31Charges) {
    console.log(`Charge ID: ${charge.id}`);
    console.log(`Date: ${new Date(charge.created * 1000).toLocaleString()}`);
    console.log(`Amount: $${(charge.amount / 100).toFixed(2)}`);
    console.log(`Email: ${charge.receipt_email || charge.billing_details?.email || 'N/A'}`);
    console.log(`Name: ${charge.billing_details?.name || 'N/A'}`);
    console.log(`Phone: ${charge.billing_details?.phone || 'N/A'}`);
    console.log(`Payment Intent: ${charge.payment_intent || 'N/A'}`);
    
    if (charge.payment_intent) {
      const pi = await stripe.paymentIntents.retrieve(charge.payment_intent as string);
      console.log(`Payment Intent Metadata:`, pi.metadata);
    }
    
    console.log('='.repeat(80) + '\n');
  }
}

const phone = process.argv[2] || '+61 410 341 673';
const amount = process.argv[3] ? parseFloat(process.argv[3]) : 219.98;

if (process.argv[2] === 'inspect') {
  inspectChargeDetails();
} else {
  findCustomer(phone, amount);
}
