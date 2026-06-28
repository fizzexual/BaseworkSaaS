import { sendWelcomeEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { registerJob } from "./index";

/**
 * Job handlers. Importing this module registers them. Add new background jobs
 * here — they get retries + backoff for free from the queue.
 */

registerJob("welcome.email", async (payload) => {
  const { email, name } = payload as { email: string; name: string };
  await sendWelcomeEmail({ to: email, name, dashboardUrl: `${env.APP_URL}/dashboard` });
});
