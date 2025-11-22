import { getUncachableStripeClient } from './stripeClient';

async function createFinishBattlePassProduct() {
  const stripe = await getUncachableStripeClient();

  // Create product
  const product = await stripe.products.create({
    name: 'Finish Battle Pass',
    description: 'Instantly complete your current battle pass tier',
    metadata: {
      type: 'battle_pass_finish'
    }
  });

  // Create price
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 100, // $1.00
    currency: 'usd',
  });

  console.log('Product created:', product.id);
  console.log('Price created:', price.id);
  console.log(`Price ID: ${price.id}`);
}

createFinishBattlePassProduct().catch(console.error);
