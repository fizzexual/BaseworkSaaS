"use client";

import { ArrowRight, Check, Loader2, MailX } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth/client";

type Status = "loading" | "success" | "error";

export default function AcceptInvitationPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const invitationId = params?.id;

  const [status, setStatus] = React.useState<Status>("loading");
  const [errorMessage, setErrorMessage] = React.useState<string>("");

  const accept = React.useCallback(async () => {
    if (!invitationId) {
      setStatus("error");
      setErrorMessage("This invitation link is missing or malformed.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");
    try {
      const { error } = await authClient.organization.acceptInvitation({ invitationId });
      if (error) {
        setStatus("error");
        setErrorMessage(error.message ?? "We couldn't accept this invitation.");
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong while accepting the invitation.");
    }
  }, [invitationId]);

  // Attempt to accept automatically when the page mounts.
  React.useEffect(() => {
    void accept();
  }, [accept]);

  // After a successful accept, redirect into the dashboard.
  React.useEffect(() => {
    if (status !== "success") return;
    const timeout = setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1000);
    return () => clearTimeout(timeout);
  }, [status, router]);

  return (
    <Card className="w-full bg-card/80 text-center backdrop-blur-sm">
      <CardHeader className="items-center">
        <span
          className={
            "mb-1 inline-flex size-12 items-center justify-center rounded-xl border border-border " +
            (status === "success" ? "bg-success/10 text-success" : "bg-secondary text-foreground")
          }
        >
          {status === "loading" && <Loader2 className="size-5 animate-spin" />}
          {status === "success" && <Check className="size-6" />}
          {status === "error" && <MailX className="size-6 text-destructive" />}
        </span>

        <CardTitle className="text-2xl">
          {status === "loading" && "Accepting invitation…"}
          {status === "success" && "You're in!"}
          {status === "error" && "Invitation problem"}
        </CardTitle>
        <CardDescription>
          {status === "loading" && "Hang tight while we add you to the organization."}
          {status === "success" && "Redirecting you to your dashboard…"}
          {status === "error" && errorMessage}
        </CardDescription>
      </CardHeader>

      {status === "error" && (
        <CardContent className="flex flex-col gap-3">
          <Button type="button" variant="brand" className="w-full" onClick={() => void accept()}>
            Try again
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => router.push("/dashboard")}
          >
            Go to dashboard
            <ArrowRight />
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
