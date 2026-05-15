"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validators/auth.schema";
import { useAuthStore } from "@/store/auth.store";
import { extractApiError } from "@/lib/api/client";
import { safeNextPath } from "@/lib/utils";

export default function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = safeNextPath(search.get("next"));
  const login = useAuthStore((s) => s.login);
  const loginTwoFactor = useAuthStore((s) => s.loginTwoFactor);
  const resendVerification = useAuthStore((s) => s.resendVerification);

  const [stage, setStage] = useState<"credentials" | "two-factor">(
    "credentials"
  );
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resentMessage, setResentMessage] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorBusy, setTwoFactorBusy] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginInput) => {
    setServerError(null);
    setUnverifiedEmail(null);
    setResentMessage(null);
    try {
      const result = await login(values);
      if (result.type === "twoFactorRequired") {
        setChallengeToken(result.challengeToken);
        setStage("two-factor");
        return;
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      const code =
        axios.isAxiosError(err) &&
        (err.response?.data as { code?: string } | undefined)?.code;
      if (code === "EMAIL_NOT_VERIFIED") {
        setUnverifiedEmail(values.email);
      }
      setServerError(extractApiError(err, "Unable to sign in"));
    }
  };

  const onSubmitTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeToken) return;
    const code = twoFactorCode.trim();
    if (!code) return;
    setServerError(null);
    setTwoFactorBusy(true);
    try {
      await loginTwoFactor({ challengeToken, code });
      router.push(next);
      router.refresh();
    } catch (err) {
      setServerError(extractApiError(err, "Could not verify the code"));
    } finally {
      setTwoFactorBusy(false);
    }
  };

  const onResend = async () => {
    if (!unverifiedEmail) return;
    setResending(true);
    setResentMessage(null);
    try {
      await resendVerification(unverifiedEmail);
      setResentMessage("Verification email sent. Please check your inbox.");
    } catch (err) {
      setResentMessage(extractApiError(err, "Could not resend right now"));
    } finally {
      setResending(false);
    }
  };

  if (stage === "two-factor") {
    return (
      <form onSubmit={onSubmitTwoFactor} className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-brand-light bg-brand-light/40 px-3 py-3 text-sm text-ink">
          <ShieldCheck className="mt-0.5 h-4 w-4 text-brand" />
          <p>
            Two-factor authentication is enabled on this account. Enter the
            6-digit code from your authenticator app, or one of your backup
            codes.
          </p>
        </div>
        {serverError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {serverError}
          </div>
        )}
        <div>
          <label htmlFor="totp" className="text-sm font-medium text-ink">
            Code
          </label>
          <input
            id="totp"
            type="text"
            inputMode="text"
            autoComplete="one-time-code"
            value={twoFactorCode}
            onChange={(e) => setTwoFactorCode(e.target.value)}
            placeholder="123456 or backup code"
            className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-sm tracking-widest focus:border-brand focus:outline-none"
            autoFocus
          />
        </div>
        <button
          type="submit"
          disabled={twoFactorBusy || twoFactorCode.trim().length === 0}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark transition disabled:opacity-60"
        >
          {twoFactorBusy && <Loader2 className="h-4 w-4 animate-spin" />}
          Verify and sign in
        </button>
        <button
          type="button"
          onClick={() => {
            setStage("credentials");
            setChallengeToken(null);
            setTwoFactorCode("");
            setServerError(null);
          }}
          className="block w-full text-center text-sm text-muted hover:text-ink"
        >
          Use a different account
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <p>{serverError}</p>
          {unverifiedEmail && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onResend}
                disabled={resending}
                className="inline-flex items-center gap-1.5 rounded-full bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800 transition disabled:opacity-60"
              >
                {resending && <Loader2 className="h-3 w-3 animate-spin" />}
                Resend verification email
              </button>
              {resentMessage && (
                <span className="text-xs text-red-700">{resentMessage}</span>
              )}
            </div>
          )}
        </div>
      )}

      <div>
        <label htmlFor="email" className="text-sm font-medium text-ink">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:border-brand focus:outline-none"
          {...register("email")}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="text-sm font-medium text-ink">
          Password
        </label>
        <div className="relative mt-1">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className="w-full rounded-xl border border-black/10 px-4 py-3 pr-11 text-sm focus:border-brand focus:outline-none"
            {...register("password")}
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
        )}
        <div className="mt-2 text-right">
          <Link
            href="/forgot-password"
            className="text-xs font-semibold text-brand hover:text-brand-dark"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark transition disabled:opacity-60"
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Sign in
      </button>

      <p className="text-center text-sm text-muted">
        New here?{" "}
        <Link href="/register" className="font-semibold text-brand hover:text-brand-dark">
          Create an account
        </Link>
      </p>
    </form>
  );
}
