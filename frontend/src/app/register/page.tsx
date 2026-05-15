import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import RegisterForm from "@/components/forms/RegisterForm";

export const metadata: Metadata = {
  title: "Create your account — Pokhara Tours and Travel",
  description: "Sign up to plan, book, and manage your Nepal adventures.",
};

export default function RegisterPage() {
  return (
    <div className="min-h-[calc(100vh-5rem)] grid lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <Image
          src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1600&q=80"
          alt="Annapurna range"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-dark/80 via-brand/40 to-transparent" />
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <h2 className="font-display text-3xl font-extrabold">
            Start your Nepal adventure
          </h2>
          <p className="mt-2 max-w-md text-white/85">
            Create an account to bookmark trips, track bookings, and unlock member-only deals.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-lg">
          <Link href="/" className="text-sm text-muted hover:text-ink">
            ← Back to home
          </Link>
          <h1 className="mt-4 font-display text-3xl font-extrabold text-ink">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-muted">
            It only takes a minute. We&apos;ll never share your information.
          </p>
          <div className="mt-7">
            <Suspense fallback={null}>
              <RegisterForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
