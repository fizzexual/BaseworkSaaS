import { render } from "@react-email/render";
import { createElement, type ReactElement } from "react";
import { emailMode, env } from "@/lib/env";
import { scopedLogger } from "@/lib/observability/logger";
import { InvitationEmail } from "./templates/invitation";
import { WelcomeEmail } from "./templates/welcome";

const log = scopedLogger("email");

type SendEmailInput = { to: string; subject: string; element: ReactElement };

/**
 * Send an email. With no RESEND_API_KEY (zero-config dev) the message is
 * rendered to plain text and printed to the server console so you can copy
 * invite/verification links without configuring a provider.
 */
export async function sendEmail({ to, subject, element }: SendEmailInput) {
  const html = await render(element);
  const text = await render(element, { plainText: true });

  if (emailMode === "console") {
    log.info({ to, subject }, "email (console transport)");
    const framed = text
      .split("\n")
      .map((line) => `│ ${line}`)
      .join("\n");
    console.log(
      `\n┌─ 📧 EMAIL (dev console transport)\n│ To:      ${to}\n│ Subject: ${subject}\n│\n${framed}\n└──────────────────────────────────────────\n`,
    );
    return { id: "console" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: env.EMAIL_FROM, to, subject, html, text }),
  });

  if (!res.ok) {
    log.error({ status: res.status, body: await res.text() }, "resend send failed");
    throw new Error(`Email send failed (${res.status})`);
  }
  return (await res.json()) as { id: string };
}

export async function sendInvitationEmail(p: {
  to: string;
  organizationName: string;
  inviterName: string;
  inviteUrl: string;
}) {
  return sendEmail({
    to: p.to,
    subject: `You've been invited to ${p.organizationName} on Basework`,
    element: createElement(InvitationEmail, p),
  });
}

export async function sendWelcomeEmail(p: { to: string; name: string; dashboardUrl: string }) {
  return sendEmail({
    to: p.to,
    subject: "Welcome to Basework 🎉",
    element: createElement(WelcomeEmail, p),
  });
}
