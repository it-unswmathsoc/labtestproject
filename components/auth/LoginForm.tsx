"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/ui/PageHeader";

const inputClass =
  "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900";

/**
 * Supabase answers both a wrong password and an unknown email with
 * invalid_credentials, deliberately — saying which one it was would let anyone
 * enumerate accounts. The friendly wording preserves that ambiguity. Every other
 * code keeps its real message so a rate limit or an outage is not mislabelled as
 * a mistyped password.
 */
function messageFor(error: { code?: string; message: string }): string {
  return error.code === "invalid_credentials"
    ? "Incorrect username or password. Please try again."
    : error.message;
}

export function LoginForm() {
  const router = useRouter();
  const notAnAdmin = useSearchParams().get("error") === "not-an-admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const { error: signInError } = await createClient().auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(messageFor(signInError));
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign-in failed. Please try again.");
    } finally {
      // finally, not just the error path: anything failing after a successful
      // sign-in would otherwise strand the button on "Signing in…" silently.
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-sm">
      <PageHeader title="Admin sign-in" subtitle="MathSoc content authors only" />

      {/* A fresh attempt outranks the redirect notice, which is now stale. */}
      {error ? (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </p>
      ) : notAnAdmin ? (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          That account is signed in but is not an admin.
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Password</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
