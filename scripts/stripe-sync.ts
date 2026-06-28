import { PLAN_LIST } from "@/lib/billing/plans";
import { getStripe } from "@/lib/billing/providers/stripe";
import { env } from "@/lib/env";

/**
 * Creates the Stripe products, recurring prices, and the `ai_credits` usage
 * meter that Basework's billing expects. Prints the price ids to copy into .env.
 */
async function main() {
  if (!env.STRIPE_SECRET_KEY) {
    console.error("STRIPE_SECRET_KEY is not set — add it to .env first.");
    process.exit(1);
  }
  const stripe = getStripe();

  for (const plan of PLAN_LIST.filter((p) => p.priceMonthly > 0)) {
    const product = await stripe.products.create({
      name: `Basework ${plan.name}`,
      metadata: { plan: plan.id },
    });
    const price = await stripe.prices.create({
      product: product.id,
      currency: "usd",
      unit_amount: plan.priceMonthly,
      recurring: { interval: "month" },
      metadata: { plan: plan.id },
    });
    console.log(`  ${plan.id.padEnd(6)} → STRIPE_PRICE_${plan.id.toUpperCase()}=${price.id}`);
  }

  try {
    const meter = await (stripe as any).billing.meters.create({
      display_name: "Usage credits",
      event_name: "ai_credits",
      default_aggregation: { formula: "sum" },
      value_settings: { event_payload_key: "value" },
    });
    console.log(`  meter  → ai_credits (${meter.id})`);
  } catch (err) {
    console.warn("  meter creation skipped:", (err as Error).message);
  }

  console.log("\n✓ Stripe synced. Copy the STRIPE_PRICE_* values into your .env.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
