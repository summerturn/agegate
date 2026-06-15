/**
 * Stripe Product & Price Setup Script
 *
 * Run: node scripts/setup-stripe.js
 *
 * Creates the four Copply plans in Stripe:
 *   - Free     ($0)
 *   - Starter  ($29/mo)
 *   - Growth   ($99/mo)
 *   - Enterprise ($299/mo)
 *
 * After running, copy the returned price IDs into your .env and Vercel dashboard.
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PRODUCTS = [
  {
    name: 'Copply Free',
    description: 'Up to 1,000 MAU. Perfect for indie devs & side projects.',
    unit_amount: 0,
    lookup_key: 'copply_free',
  },
  {
    name: 'Copply Starter',
    description: 'Up to 10,000 MAU. Priority email support.',
    unit_amount: 2900, // $29.00
    lookup_key: 'copply_starter',
  },
  {
    name: 'Copply Growth',
    description: 'Up to 100,000 MAU. Webhook logs + custom branding.',
    unit_amount: 9900, // $99.00
    lookup_key: 'copply_growth',
  },
  {
    name: 'Copply Enterprise',
    description: 'Unlimited MAU. Dedicated Slack + SLA.',
    unit_amount: 29900, // $299.00
    lookup_key: 'copply_enterprise',
  },
];

async function main() {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY is required');
    process.exit(1);
  }

  console.log('🚀 Creating Stripe products & prices for Copply...\n');

  for (const p of PRODUCTS) {
    const product = await stripe.products.create({
      name: p.name,
      description: p.description,
      lookup_key: p.lookup_key,
      metadata: { tier: p.lookup_key.replace('copply_', '') },
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: p.unit_amount,
      currency: 'usd',
      recurring: { interval: 'month' },
      lookup_key: `${p.lookup_key}_monthly`,
    });

    console.log(`✅ ${p.name}`);
    console.log(`   Product ID: ${product.id}`);
    console.log(`   Price  ID : ${price.id}`);
    console.log(`   Amount    : $${(p.unit_amount / 100).toFixed(2)}/mo\n`);
  }

  console.log('🎉 Done! Add these Price IDs to your .env and Vercel dashboard.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
