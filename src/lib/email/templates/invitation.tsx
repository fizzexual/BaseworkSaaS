import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export function InvitationEmail({
  organizationName,
  inviterName,
  inviteUrl,
}: {
  to?: string;
  organizationName: string;
  inviterName: string;
  inviteUrl: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Join {organizationName} on Basework</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>You're invited 🎉</Heading>
          <Text style={text}>
            <strong>{inviterName}</strong> has invited you to join{" "}
            <strong>{organizationName}</strong> on Basework.
          </Text>
          <Section style={{ margin: "28px 0" }}>
            <Button href={inviteUrl} style={button}>
              Accept invitation
            </Button>
          </Section>
          <Text style={muted}>
            Or paste this link into your browser:
            <br />
            {inviteUrl}
          </Text>
          <Hr style={hr} />
          <Text style={muted}>
            If you weren't expecting this invitation, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#0b0b0f",
  color: "#e5e7eb",
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
};
const container = { maxWidth: "480px", margin: "0 auto", padding: "32px 24px" };
const heading = { color: "#ffffff", fontSize: "24px", fontWeight: 700 as const };
const text = { fontSize: "15px", lineHeight: "24px" };
const button = {
  background: "linear-gradient(90deg, #7c3aed, #db2777, #f97316)",
  color: "#ffffff",
  padding: "12px 22px",
  borderRadius: "10px",
  fontSize: "14px",
  fontWeight: 600 as const,
  textDecoration: "none",
};
const muted = { color: "#9ca3af", fontSize: "12px", lineHeight: "20px" };
const hr = { borderColor: "#1f2937", margin: "24px 0" };
