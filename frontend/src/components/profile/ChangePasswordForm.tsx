"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
} from "lucide-react";
import {
  changePasswordSchema,
  changePasswordOtpSchema,
  type ChangePasswordInput,
  type ChangePasswordOtpInput,
} from "@/lib/validators/auth.schema";
import { useAuthStore } from "@/store/auth.store";
import { extractApiError } from "@/lib/api/client";

type Stage = "enter" | "verify" | "done";

export default function ChangePasswordForm() {
  const requestPasswordChange = useAuthStore((s) => s.requestPasswordChange);
  const confirmPasswordChange = useAuthStore((s) => s.confirmPasswordChange);

  const [stage, setStage] = useState<Stage>("enter");
  const [pendingNewPassword, setPendingNewPassword] = useState("");
  const [emailHint, setEmailHint] = useState("");
  const [ttlMinutes, setTtlMinutes] = useState(10);

  const reset = () => {
    setStage("enter");
    setPendingNewPassword("");
    setEmailHint("");
  };

  if (stage === "verify") {
    return (
      <VerifyStep
        emailHint={emailHint}
        ttlMinutes={ttlMinutes}
        onVerify={async (otp) => {
          await confirmPasswordChange({ otp, newPassword: pendingNewPassword });
          setStage("done");
          setPendingNewPassword("");
        }}
        onBack={reset}
      />
    );
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
              Password updated
            </h2>
            <p className="text-xs text-muted">
              Use your new password next time you sign in.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex items-center gap-1 rounded-full border border-brand/30 px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand-light"
        >
          Change again
        </button>
      </section>
    );
  }

  return (
    <EnterStep
      onSubmit={async ({ currentPassword, newPassword }) => {
        const result = await requestPasswordChange({ currentPassword });
        setPendingNewPassword(newPassword);
        setEmailHint(result.emailHint);
        setTtlMinutes(result.ttlMinutes);
        setStage("verify");
      }}
    />
  );
}

function EnterStep({
  onSubmit,
}: {
  onSubmit: (values: ChangePasswordInput) => Promise<void>;
}) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const submit = async (values: ChangePasswordInput) => {
    setServerError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      setServerError(extractApiError(err, "Could not start password change"));
    }
  };

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <header className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
          <KeyRound className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold text-ink">
            Change password
          </h2>
          <p className="text-xs text-muted">
            We&apos;ll email you a 6-digit code to confirm.
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit(submit)} className="mt-5 space-y-4">
        {serverError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <div>
          <label htmlFor="currentPassword" className="text-sm font-medium text-ink">
            Current password
          </label>
          <div className="relative mt-1">
            <input
              id="currentPassword"
              type={showCurrent ? "text" : "password"}
              autoComplete="current-password"
              className="w-full rounded-xl border border-black/10 px-4 py-3 pr-11 text-sm focus:border-brand focus:outline-none"
              {...register("currentPassword")}
            />
            <button
              type="button"
              aria-label={showCurrent ? "Hide password" : "Show password"}
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="mt-1 text-xs text-red-600">
              {errors.currentPassword.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="newPassword" className="text-sm font-medium text-ink">
            New password
          </label>
          <div className="relative mt-1">
            <input
              id="newPassword"
              type={showNew ? "text" : "password"}
              autoComplete="new-password"
              className="w-full rounded-xl border border-black/10 px-4 py-3 pr-11 text-sm focus:border-brand focus:outline-none"
              {...register("newPassword")}
            />
            <button
              type="button"
              aria-label={showNew ? "Hide password" : "Show password"}
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.newPassword ? (
            <p className="mt-1 text-xs text-red-600">{errors.newPassword.message}</p>
          ) : (
            <p className="mt-1 text-xs text-muted">
              8+ chars with uppercase, lowercase, number, and special character.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="confirmNewPassword" className="text-sm font-medium text-ink">
            Confirm new password
          </label>
          <input
            id="confirmNewPassword"
            type={showNew ? "text" : "password"}
            autoComplete="new-password"
            className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:border-brand focus:outline-none"
            {...register("confirmNewPassword")}
          />
          {errors.confirmNewPassword && (
            <p className="mt-1 text-xs text-red-600">
              {errors.confirmNewPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark transition disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
          Send verification code
        </button>
      </form>
    </section>
  );
}

function VerifyStep({
  emailHint,
  ttlMinutes,
  onVerify,
  onBack,
}: {
  emailHint: string;
  ttlMinutes: number;
  onVerify: (otp: string) => Promise<void>;
  onBack: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordOtpInput>({
    resolver: zodResolver(changePasswordOtpSchema),
    defaultValues: { otp: "" },
  });

  const submit = async (values: ChangePasswordOtpInput) => {
    setServerError(null);
    try {
      await onVerify(values.otp);
    } catch (err) {
      setServerError(extractApiError(err, "Could not verify code"));
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
            Enter the verification code
          </h2>
          <p className="text-xs text-muted">
            Code sent to <span className="font-semibold text-ink">{emailHint}</span>.
            Expires in {ttlMinutes} minutes.
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit(submit)} className="mt-5 space-y-4">
        {serverError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {serverError}
          </div>
        )}

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
            placeholder="123456"
            className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] focus:border-brand focus:outline-none"
            {...register("otp")}
          />
          {errors.otp && (
            <p className="mt-1 text-xs text-red-600">{errors.otp.message}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark transition disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            Verify and update password
          </button>
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:text-brand disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Start over
          </button>
        </div>

        <p className="text-xs text-muted">
          Didn&apos;t get a code? Check your spam folder, then start over to send a
          new one.
        </p>
      </form>
    </section>
  );
}
