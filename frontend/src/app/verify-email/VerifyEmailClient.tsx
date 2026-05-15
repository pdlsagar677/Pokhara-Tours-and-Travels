"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { CheckCircle2, Loader2, MailWarning } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { extractApiError } from "@/lib/api/client";

type Status = "verifying" | "success" | "already" | "expired" | "error";

export default function VerifyEmailClient() {
  const router = useRouter();
  const search = useSearchParams();
  const verifyEmail = useAuthStore((s) => s.verifyEmail);
  const resendVerification = useAuthStore((s) => s.resendVerification);

  const token = search.get("token") || "";
  const id = search.get("id") || "";

  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState<string>("");
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resentMessage, setResentMessage] = useState<string | null>(null);

  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    if (!token || !id) {
      setStatus("error");
      setMessage("Missing verification parameters. Please use the link from the email.");
      return;
    }
    (async () => {
      try {
        const result = await verifyEmail({ token, id });
        if (result.alreadyVerified) {
          setStatus("already");
          setMessage("Your email is already verified. You can sign in.");
        } else {
          setStatus("success");
          setMessage("Email verified! You're now signed in.");
          setTimeout(() => router.push("/"), 1500);
        }
      } catch (err) {
        const code =
          axios.isAxiosError(err) &&
          (err.response?.data as { code?: string } | undefined)?.code;
        if (code === "VERIFY_EXPIRED") {
          setStatus("expired");
        } else {
          setStatus("error");
        }
        setMessage(extractApiError(err, "Verification failed"));
      }
    })();
  }, [token, id, router, verifyEmail]);

  const onResend = async () => {
    if (!resendEmail) return;
    setResending(true);
    setResentMessage(null);
    try {
      await resendVerification(resendEmail);
      setResentMessage("If the account exists, a new verification email has been sent.");
    } catch (err) {
      setResentMessage(extractApiError(err, "Could not resend right now"));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-md text-center">
      {status === "verifying" && (
        <>
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-brand" />
          <h1 className="mt-4 font-display text-2xl font-extrabold text-ink">
            Verifying your email…
          </h1>
          <p className="mt-2 text-sm text-muted">Hang tight, this only takes a moment.</p>
        </>
      )}

      {(status === "success" || status === "already") && (
        <>
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
        </>
      )}

      {(status === "error" || status === "expired") && (
        <>
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
            <MailWarning className="h-8 w-8" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-ink">
            {status === "expired" ? "Link expired" : "Verification failed"}
          </h1>
          <p className="mt-2 text-sm text-muted">{message}</p>

          <div className="mt-6 rounded-2xl border border-black/5 bg-white p-5 text-left shadow-sm">
            <p className="text-sm font-medium text-ink">Resend verification email</p>
            <p className="mt-1 text-xs text-muted">
              Enter your email and we&apos;ll send you a new link.
            </p>
            <div className="mt-3 flex gap-2">
              <input
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 rounded-xl border border-black/10 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
              <button
                type="button"
                onClick={onResend}
                disabled={resending || !resendEmail}
                className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark transition disabled:opacity-60"
              >
                {resending && <Loader2 className="h-4 w-4 animate-spin" />}
                Resend
              </button>
            </div>
            {resentMessage && (
              <p className="mt-2 text-xs text-ink">{resentMessage}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
