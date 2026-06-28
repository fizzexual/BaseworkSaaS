import { handleStripeWebhook } from "@/lib/billing/webhook";
import { billingMode } from "@/lib/env";
import { scopedLogger } from "@/lib/observability/logger";

const log = scopedLogger("billing:webhook");

export async function POST(req: Request) {
  if (billingMode !== "stripe") {
    return new Response("Billing not configured", { status: 404 });
  }
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing stripe-signature", { status: 400 });

  // Stripe requires the raw, unparsed body for signature verification.
  const rawBody = await req.text();
  try {
    const result = await handleStripeWebhook(rawBody, signature);
    return Response.json(result);
  } catch (err) {
    log.error({ err }, "stripe webhook verification failed");
    return new Response(`Webhook error: ${(err as Error).message}`, { status: 400 });
  }
}
