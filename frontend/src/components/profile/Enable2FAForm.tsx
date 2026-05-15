"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { authService } from "@/lib/api/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { extractApiError } from "@/lib/api/client";

type EnrollmentData = {
  otpauthUrl: string;
  secretBase32: string;
  backupCodes: string[];
  ttlMinutes: number;
};

type Stage = "intro" | "scan" | "done";

export default function Enable2FAForm() {
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [stage, setStage] = useState<Stage>("intro");
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [savedAck, setSavedAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  if (user.twoFactorEnabled) {
    return null;
  }

  if (stage === "done") {
    return (
      <section className="rounded-2xl border border-green-200 bg-green-50 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-ink">
              Two-factor authentication enabled
            </h2>
            <p className="text-xs text-muted">
              Next time you sign in, you&apos;ll be asked for a code from your
              authenticator app.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (stage === "scan" && enrollment) {
    const onConfirm = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!/^\d{6}$/.test(code)) {
        setError("Enter the 6-digit code from your authenticator app");
        return;
      }
      if (!savedAck) {
        setError("Please confirm you've saved your backup codes");
        return;
      }
      setBusy(true);
      setError(null);
      try {
        const updated = await authService.enableTwoFactor({ code });
        if (accessToken) {
          setSession({ user: updated, accessToken });
        }
        setStage("done");
      } catch (err) {
        setError(extractApiError(err, "Could not verify code"));
      } finally {
        setBusy(false);
      }
    };

    return (
      <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <header className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-ink">
              Scan and verify
            </h2>
            <p className="text-xs text-muted">
              Set up takes ~1 minute. You have {enrollment.ttlMinutes} minutes
              before the secret expires.
            </p>
          </div>
        </header>

        <form onSubmit={onConfirm} className="mt-5 space-y-5">
          <div className="grid gap-5 md:grid-cols-[auto_1fr] md:items-start">
            <div className="rounded-xl border border-black/10 bg-white p-3">
              <QRCodeSVG value={enrollment.otpauthUrl} size={176} />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-ink">
                  1. Scan with Google Authenticator, 1Password, Authy, etc.
                </p>
                <p className="mt-1 text-xs text-muted">
                  Or enter this secret manually:
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <code className="break-all rounded bg-soft px-2 py-1 text-xs">
                    {enrollment.secretBase32}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(enrollment.secretBase32);
                    }}
                    className="text-muted hover:text-ink"
                    aria-label="Copy secret"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">
              2. Save your backup codes
            </p>
            <p className="mt-1 text-xs text-amber-900/80">
              Each code works once. Use them if you lose access to your
              authenticator app. We won&apos;t show them again.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-xs">
              {enrollment.backupCodes.map((c) => (
                <code
                  key={c}
                  className="rounded bg-white px-2 py-1 text-center"
                >
                  {c}
                </code>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(
                    enrollment.backupCodes.join("\n")
                  );
                }}
                className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100"
              >
                <Copy className="h-3 w-3" />
                Copy all
              </button>
              <label className="inline-flex items-center gap-2 text-xs text-amber-900">
                <input
                  type="checkbox"
                  checked={savedAck}
                  onChange={(e) => setSavedAck(e.target.checked)}
                />
                I&apos;ve saved my backup codes
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="totp-confirm" className="text-sm font-medium text-ink">
              3. Enter the 6-digit code from your app
            </label>
            <input
              id="totp-confirm"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] focus:border-brand focus:outline-none"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark transition disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              Enable 2FA
            </button>
            <button
              type="button"
              onClick={() => {
                setStage("intro");
                setEnrollment(null);
                setCode("");
                setSavedAck(false);
                setError(null);
              }}
              className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:text-brand"
            >
              <ArrowLeft className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </form>
      </section>
    );
  }

  const onStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Enter your current password");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const data = await authService.setupTwoFactor({ password });
      setEnrollment(data);
      setPassword("");
      setStage("scan");
    } catch (err) {
      setError(extractApiError(err, "Could not start 2FA setup"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <header className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold text-ink">
            Two-factor authentication
          </h2>
          <p className="text-xs text-muted">
            Add an extra layer using an authenticator app.
          </p>
        </div>
      </header>

      <form onSubmit={onStart} className="mt-5 space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="enable-2fa-password" className="text-sm font-medium text-ink">
            Confirm with your current password
          </label>
          <div className="relative mt-1">
            <input
              id="enable-2fa-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-black/10 px-4 py-3 pr-11 text-sm focus:border-brand focus:outline-none"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark transition disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}
          Get QR code
        </button>
      </form>
    </section>
  );
}
