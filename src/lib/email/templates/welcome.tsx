import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export function WelcomeEmail({
  name,
  dashboardUrl,
}: {
  to?: string;
  name: string;
  dashboardUrl: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Basework</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Welcome, {name} 👋</Heading>
          <Text style={text}>
            Your Basework workspace is ready. Invite your team, explore the example AI module, and
            wire up billing whenever you're ready.
          </Text>
          <Section style={{ margin: "28px 0" }}>
            <Button href={dashboardUrl} style={button}>
              Open dashboard
            </Button>
          </Section>
          <Text style={muted}>Built on Basework — the complete SaaS template.</Text>
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
