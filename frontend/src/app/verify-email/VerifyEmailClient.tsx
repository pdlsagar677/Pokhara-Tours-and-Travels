"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { CheckCircle2, Loader2, MailCheck } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { extractApiError } from "@/lib/api/client";

type Status = "idle" | "submitting" | "success" | "already" | "error";

export default function VerifyEmailClient() {
  const router = useRouter();
  const search = useSearchParams();
  const verifyEmail = useAuthStore((s) => s.verifyEmail);
  const resendVerification = useAuthStore((s) => s.resendVerification);

  const [email, setEmail] = useState(() => search.get("email") || "");
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");

  const [resending, setResending] = useState(false);
  const [resentMessage, setResentMessage] = useState<string | null>(null);

  // Keep URL email param in sync if user lands here with ?email=
  useEffect(() => {
    const q = search.get("email");
    if (q && q !== email) setEmail(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const canSubmit = email.length > 0 && /^\d{6}$/.test(otp) && status !== "submitting";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("submitting");
    setMessage("");
    try {
      const result = await verifyEmail({ email, otp });
      if (result.alreadyVerified) {
        setStatus("already");
        setMessage("Your email is already verified. You can sign in.");
      } else {
        setStatus("success");
        setMessage("Email verified! You're now signed in.");
        setTimeout(() => router.push("/"), 1500);
      }
    } catch (err) {
      setStatus("error");
      const code =
        axios.isAxiosError(err) &&
        (err.response?.data as { code?: string } | undefined)?.code;
      if (code === "VERIFY_EXPIRED") {
        setMessage("Your code has expired. Request a new one below.");
      } else {
        setMessage(extractApiError(err, "Invalid or expired code"));
      }
    }
  };

  const onResend = async () => {
    if (!email) {
      setResentMessage("Enter your email first.");
      return;
    }
    setResending(true);
    setResentMessage(null);
    try {
      await resendVerification(email);
      setResentMessage("A new code has been sent. Check your inbox.");
      setOtp("");
    } catch (err) {
      setResentMessage(extractApiError(err, "Could not resend right now"));
    } finally {
      setResending(false);
    }
  };

  if (status === "success" || status === "already") {
    return (
      <div className="w-full max-w-md text-center">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-extrabold text-ink">
          {status === "success" ? "You're verified!" : "Already verified"}
        </h1>
        <p className="mt-2 text-sm text-muted">{message}</p>
        <div className="mt-6 flex justify-center gap-2">
          <Link
            href="/"
            className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark transition"
          >
            Go to home
          </Link>
          {status === "already" && (
            <Link
              href="/login"
              className="rounded-full border border-brand/30 px-5 py-2 text-sm font-semibold text-brand hover:bg-brand-light transition"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-light text-brand">
          <MailCheck className="h-8 w-8" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-extrabold text-ink">
          Verify your email
        </h1>
        <p className="mt-2 text-sm text-muted">
          We&apos;ve sent a 6-digit code to your inbox. Enter it below to activate your account.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:border-brand focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="otp" className="text-sm font-medium text-ink">
            6-digit code
          </label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-center text-lg font-mono tracking-[0.5em] focus:border-brand focus:outline-none"
          />
        </div>

        {status === "error" && message && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark transition disabled:opacity-60"
        >
          {status === "submitting" && <Loader2 className="h-4 w-4 animate-spin" />}
          Verify email
        </button>
      </form>

      <div className="mt-6 rounded-2xl border border-black/5 bg-white p-5 text-center shadow-sm">
        <p className="text-sm font-medium text-ink">Didn&apos;t get the code?</p>
        <p className="mt-1 text-xs text-muted">
          Check your spam folder, or request a fresh code.
        </p>
        <button
          type="button"
          onClick={onResend}
          disabled={resending || !email}
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-white px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-light transition disabled:opacity-60"
        >
          {resending && <Loader2 className="h-4 w-4 animate-spin" />}
          Resend code
        </button>
        {resentMessage && (
          <p className="mt-2 text-xs text-ink">{resentMessage}</p>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-muted">
        Already verified?{" "}
        <Link href="/login" className="font-semibold text-brand hover:text-brand-dark">
          Sign in
        </Link>
      </p>
    </div>
  );
}
