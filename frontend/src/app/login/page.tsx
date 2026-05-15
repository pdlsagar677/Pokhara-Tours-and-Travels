import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import LoginForm from "@/components/forms/LoginForm";

export const metadata: Metadata = {
  title: "Sign in — Pokhara Tours and Travel",
  description: "Sign in to your Pokhara Tours and Travel account.",
};

export default function LoginPage() {
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
            Welcome back to your Nepal journey
          </h2>
          <p className="mt-2 max-w-md text-white/85">
            Sign in to manage your bookings, save destinations, and chat with our travel specialists.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-md">
          <Link href="/" className="text-sm text-muted hover:text-ink">
            ← Back to home
          </Link>
          <h1 className="mt-4 font-display text-3xl font-extrabold text-ink">
            Sign in
          </h1>
          <p className="mt-1 text-sm text-muted">
            Use your email and password to access your account.
          </p>
          <div className="mt-7">
            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
