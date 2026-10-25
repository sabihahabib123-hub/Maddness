"use client";

import { useActionState } from "react";
import { Alert } from "@/components/arc/alert/alert";
import { Button } from "@/components/arc/button/button";
import { Input } from "@/components/arc/input/input";
import { login, type LoginState } from "../actions/auth";

export function LoginForm({ mode }: { mode: "supabase" | "demo" | "none" }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, null);

  if (mode === "none") {
    return (
      <Alert tone="warning" title="Connect Supabase or enable demo mode">
        Set the Supabase variables, or set DEMO_ADMIN_PASSWORD and DEMO_SESSION_SECRET for local development. The README explains both.
      </Alert>
    );
  }

  return (
    <form action={action} className="grid gap-4">
      {state?.error && <Alert tone="danger" title={state.error} />}
      {mode === "supabase" && <Input label="Email" name="email" type="email" autoComplete="username" required defaultValue={state?.email} />}
      <Input label="Password" name="password" type="password" autoComplete="current-password" required />
      <Button type="submit" loading={pending} className="w-full">
        Sign in
      </Button>
    </form>
  );
}
