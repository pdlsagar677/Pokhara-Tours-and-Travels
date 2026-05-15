"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validators/auth.schema";
import { authService } from "@/lib/api/auth.service";
import { extractApiError } from "@/lib/api/client";

export default function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotPasswordInput) => {
    setServerError(null);
    try {
      await authService.forgotPassword(values.email);
      setSent(true);
    } catch (err) {
      setServerError(extractApiError(err, "Could not send the reset email"));
    }
  };

  if (sent) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
          <div className="text-sm text-green-900">
            <p className="font-semibold">Check your inbox</p>
            <p className="mt-1">
              If an account exists for{" "}
              <span className="font-medium">{getValues("email")}</span>, we&apos;ve
              sent a password-reset link. It expires in 60 minutes.
            </p>
          </div>
        </div>
        <p className="text-xs text-muted">
          Didn&apos;t get an email? Check spam, or wait a minute and try again
          from the link below.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setSent(false)}
            className="rounded-full border border-brand/30 px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-light transition"
          >
            Send to a different email
          </button>
          <Link
            href="/login"
            className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark transition"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <div>
        <label htmlFor="email" className="text-sm font-medium text-ink">
          Email
        </label>
        <div className="relative mt-1">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            className="w-full rounded-xl border border-black/10 pl-9 pr-4 py-3 text-sm focus:border-brand focus:outline-none"
            placeholder="you@example.com"
            {...register("email")}
          />
        </div>
        {errors.email && (
          <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark transition disabled:opacity-60"
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Send reset link
      </button>

      <p className="text-center text-sm text-muted">
        Remembered it?{" "}
        <Link
          href="/login"
          className="font-semibold text-brand hover:text-brand-dark"
        >
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
