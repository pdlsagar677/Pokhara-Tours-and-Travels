"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { registerSchema, type RegisterInput } from "@/lib/validators/auth.schema";
import { useAuthStore } from "@/store/auth.store";
import { extractApiError } from "@/lib/api/client";

export default function RegisterForm() {
  const registerUser = useAuthStore((s) => s.register);
  const resendVerification = useAuthStore((s) => s.resendVerification);

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resentMessage, setResentMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegisterInput) => {
    setServerError(null);
    try {
      await registerUser({
        name: values.name,
        username: values.username,
        email: values.email,
        phone: values.phone,
        password: values.password,
      });
      setSubmittedEmail(values.email);
    } catch (err) {
      setServerError(extractApiError(err, "Unable to create account"));
    }
  };

  const onResend = async () => {
    if (!submittedEmail) return;
    setResending(true);
    setResentMessage(null);
    try {
      await resendVerification(submittedEmail);
      setResentMessage("Verification email sent. Please check your inbox.");
    } catch (err) {
      setResentMessage(extractApiError(err, "Could not resend right now"));
    } finally {
      setResending(false);
    }
  };

  if (submittedEmail) {
    return (
      <div className="rounded-2xl border border-brand/20 bg-brand-light/40 p-6 text-center">
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white">
          <MailCheck className="h-6 w-6" />
        </div>
        <h2 className="mt-4 font-display text-xl font-extrabold text-ink">
          Check your inbox
        </h2>
        <p className="mt-2 text-sm text-muted">
          We&apos;ve sent a verification link to{" "}
          <span className="font-semibold text-ink">{submittedEmail}</span>.
          Click the link to activate your account.
        </p>
        <p className="mt-4 text-xs text-muted">
          Don&apos;t see it? Check your spam folder, or
        </p>
        <button
          type="button"
          onClick={onResend}
          disabled={resending}
          className="mt-2 inline-flex items-center gap-2 rounded-full border border-brand/40 bg-white px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-light transition disabled:opacity-60"
        >
          {resending && <Loader2 className="h-4 w-4 animate-spin" />}
          Resend verification email
        </button>
        {resentMessage && (
          <p className="mt-3 text-xs text-ink">{resentMessage}</p>
        )}
        <p className="mt-6 text-xs text-muted">
          Already verified?{" "}
          <Link href="/login" className="font-semibold text-brand hover:text-brand-dark">
            Sign in
          </Link>
        </p>
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
        <label htmlFor="name" className="text-sm font-medium text-ink">
          Full name
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:border-brand focus:outline-none"
          {...register("name")}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="username" className="text-sm font-medium text-ink">
          Username
        </label>
        <input
          id="username"
          type="text"
          autoComplete="username"
          placeholder="e.g. raj_pokhara"
          className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:border-brand focus:outline-none"
          {...register("username")}
        />
        {errors.username && (
          <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
          <label htmlFor="phone" className="text-sm font-medium text-ink">
            Phone
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+977 98XXXXXXXX"
            className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:border-brand focus:outline-none"
            {...register("phone")}
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="password" className="text-sm font-medium text-ink">
          Password
        </label>
        <div className="relative mt-1">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
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
        {errors.password ? (
          <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
        ) : (
          <p className="mt-1 text-xs text-muted">
            8+ chars with uppercase, lowercase, number, and special character.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="text-sm font-medium text-ink">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:border-brand focus:outline-none"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark transition disabled:opacity-60"
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Create account
      </button>

      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand hover:text-brand-dark">
          Sign in
        </Link>
      </p>
    </form>
  );
}
