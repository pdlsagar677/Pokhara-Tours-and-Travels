import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import ResetPasswordClient from "./ResetPasswordClient";

export const metadata: Metadata = {
  title: "Reset password — Pokhara Tours and Travel",
  description: "Choose a new password for your Pokhara Tours and Travel account.",
};

export default function ResetPasswordPage() {
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
            One last step
          </h2>
          <p className="mt-2 max-w-md text-white/85">
            Pick a strong, unique password — at least 8 characters with a mix of
            cases, a number, and a special character.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-md">
          <Link href="/login" className="text-sm text-muted hover:text-ink">
            ← Back to sign in
          </Link>
          <h1 className="mt-4 font-display text-3xl font-extrabold text-ink">
            Choose a new password
          </h1>
          <p className="mt-1 text-sm text-muted">
            Use a password you don&apos;t use anywhere else.
          </p>
          <div className="mt-7">
            <Suspense fallback={null}>
              <ResetPasswordClient />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
