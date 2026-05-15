"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Eye, EyeOff, Loader2, ShieldAlert } from "lucide-react";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validators/auth.schema";
import { authService } from "@/lib/api/auth.service";
import { extractApiError } from "@/lib/api/client";

export default function ResetPasswordClient() {
  const search = useSearchParams();
  const token = search.get("token") || "";
  const id = search.get("id") || "";

  const [done, setDone] = useState(false);
  const [linkExpired, setLinkExpired] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmNewPassword: "" },
  });

  if (!token || !id) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800">
          <ShieldAlert className="mt-0.5 h-5 w-5 text-red-600" />
          <p>
            This reset link is missing required information. Please use the link
            from your email, or request a new one.
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="inline-flex rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark transition"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
          <div className="text-sm text-green-900">
            <p className="font-semibold">Password updated</p>
            <p className="mt-1">
              You can sign in with your new password. For your safety we&apos;ve
              also signed you out of any other devices.
            </p>
          </div>
        </div>
        <Link
          href="/login"
          className="inline-flex rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark transition"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (linkExpired) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800">
          <ShieldAlert className="mt-0.5 h-5 w-5 text-red-600" />
          <p>
            This reset link has expired. Reset links are valid for 60 minutes
            and can only be used once.
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="inline-flex rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark transition"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  const onSubmit = async (values: ResetPasswordInput) => {
    setServerError(null);
    try {
      await authService.resetPassword({
        token,
        id,
        newPassword: values.newPassword,
      });
      setDone(true);
    } catch (err) {
      const code =
        axios.isAxiosError(err) &&
        (err.response?.data as { code?: string } | undefined)?.code;
      if (code === "RESET_EXPIRED") {
        setLinkExpired(true);
        return;
      }
      setServerError(extractApiError(err, "Could not reset your password"));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <div>
        <label htmlFor="newPassword" className="text-sm font-medium text-ink">
          New password
        </label>
        <div className="relative mt-1">
          <input
            id="newPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            className="w-full rounded-xl border border-black/10 px-4 py-3 pr-11 text-sm focus:border-brand focus:outline-none"
            {...register("newPassword")}
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
        {errors.newPassword && (
          <p className="mt-1 text-xs text-red-600">
            {errors.newPassword.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="confirmNewPassword"
          className="text-sm font-medium text-ink"
        >
          Confirm new password
        </label>
        <input
          id="confirmNewPassword"
          type={showPassword ? "text" : "password"}
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
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark transition disabled:opacity-60"
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Update password
      </button>
    </form>
  );
}
