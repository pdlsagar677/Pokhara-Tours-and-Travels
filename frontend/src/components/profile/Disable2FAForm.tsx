"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, ShieldOff } from "lucide-react";
import { authService } from "@/lib/api/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { extractApiError } from "@/lib/api/client";

export default function Disable2FAForm() {
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!user || !user.twoFactorEnabled) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !code) {
      setError("Password and 2FA code are required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await authService.disableTwoFactor({ password, code });
      if (accessToken) {
        setSession({ user: updated, accessToken });
      }
      setPassword("");
      setCode("");
      setDone(true);
    } catch (err) {
      setError(extractApiError(err, "Could not disable 2FA"));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <p className="text-sm text-ink">
          Two-factor authentication is now off.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <header className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-700">
          <ShieldOff className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold text-ink">
            Disable two-factor authentication
          </h2>
          <p className="text-xs text-muted">
            Confirm with your password and a current 2FA code (or backup code).
          </p>
        </div>
      </header>

      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="disable-2fa-password" className="text-sm font-medium text-ink">
            Current password
          </label>
          <div className="relative mt-1">
            <input
              id="disable-2fa-password"
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

        <div>
          <label htmlFor="disable-2fa-code" className="text-sm font-medium text-ink">
            2FA code
          </label>
          <input
            id="disable-2fa-code"
            type="text"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456 or backup code"
            className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-sm tracking-widest focus:border-brand focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-white px-6 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 transition disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldOff className="h-4 w-4" />
          )}
          Disable 2FA
        </button>
      </form>
    </section>
  );
}
