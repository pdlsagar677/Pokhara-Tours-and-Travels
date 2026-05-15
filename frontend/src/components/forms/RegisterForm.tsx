"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { registerSchema, type RegisterInput } from "@/lib/validators/auth.schema";
import { useAuthStore } from "@/store/auth.store";
import { extractApiError } from "@/lib/api/client";

export default function RegisterForm() {
  const router = useRouter();
  const registerUser = useAuthStore((s) => s.register);

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

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
      router.push(`/verify-email/?email=${encodeURIComponent(values.email)}`);
    } catch (err) {
      setServerError(extractApiError(err, "Unable to create account"));
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
