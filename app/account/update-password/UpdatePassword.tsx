"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePassword() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSuccess(false);
    setIsSubmitting(true);

    try {
      const { error } = await createClient().auth.updateUser({ password });
      if (error) throw error;
      setIsSuccess(true);
      setMessage("Your password has been updated.");
      setPassword("");
    } catch (error) {
      console.error("Could not update the account password.", error);
      setMessage(
        error instanceof Error ? error.message : "We couldn’t update your password.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative isolate flex min-h-svh items-center justify-center overflow-hidden bg-[#f7f9f7] px-4 py-10 text-[#17251e]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[url('/IMAGES/vendor-onboarding-background.jpeg')] bg-cover bg-center opacity-20"
      />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-white/70" />
      <section className="w-full max-w-lg rounded-3xl border border-[#e6ebe7] bg-white p-7 shadow-[0_16px_50px_rgba(27,52,39,0.08)] sm:p-10">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#0e3b31] text-sm text-white">
            B
          </span>
          Brandels
        </Link>
        <h1 className="mt-8 text-3xl font-semibold tracking-[-0.035em]">
          Set a new password
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#68716b]">
          Choose a new password for your account.
        </p>
        <form onSubmit={(event) => void submitPassword(event)} className="mt-7 space-y-5">
          <label className="block text-sm font-medium">
            New password
            <input
              required
              minLength={10}
              pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{10,}"
              title="Use at least 10 characters, including lowercase, uppercase, a number, and a special character."
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[#dce4de] px-4 py-3 text-sm outline-none focus:border-[#14785e] focus:ring-2 focus:ring-[#14785e]/15"
            />
          </label>
          {message && (
            <p
              role="status"
              className={`text-sm leading-6 ${isSuccess ? "text-[#13875f]" : "text-[#a33d32]"}`}
            >
              {message}
            </p>
          )}
          {isSuccess ? (
            <Link
              href="/"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#0e3b31] px-5 text-sm font-semibold text-white hover:bg-[#145542]"
            >
              Return to Brandels
            </Link>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-12 w-full rounded-full bg-[#0e3b31] px-5 text-sm font-semibold text-white hover:bg-[#145542] disabled:cursor-wait disabled:opacity-60"
            >
              {isSubmitting ? "Updating…" : "Update password"}
            </button>
          )}
        </form>
      </section>
    </main>
  );
}
