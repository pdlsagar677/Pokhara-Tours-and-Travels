import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import ForgotPasswordForm from "@/components/forms/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot password — Pokhara Tours and Travel",
  description: "Reset your Pokhara Tours and Travel account password via email.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-[calc(100vh-5rem)] grid lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <Image
          src="https://images.unsplash.com/photo-1551918120-9739cb430c6d?auto=format&fit=crop&w=1600&q=80"
          alt="Phewa Lake at sunrise"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-brand/70 via-brand/40 to-transparent" />
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <h2 className="font-display text-3xl font-extrabold">
            Locked out? We&apos;ll help you back in.
          </h2>
          <p className="mt-2 max-w-md text-white/85">
            Enter the email you signed up with and we&apos;ll send you a secure link to choose a new password.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-md">
          <Link href="/login" className="text-sm text-muted hover:text-ink">
            ← Back to sign in
          </Link>
          <h1 className="mt-4 font-display text-3xl font-extrabold text-ink">
            Reset your password
          </h1>
          <p className="mt-1 text-sm text-muted">
            We&apos;ll email you a one-time link that expires in 60 minutes.
          </p>
          <div className="mt-7">
            <Suspense fallback={null}>
              <ForgotPasswordForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
