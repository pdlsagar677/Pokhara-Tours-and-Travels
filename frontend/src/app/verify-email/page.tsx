import type { Metadata } from "next";
import { Suspense } from "react";
import VerifyEmailClient from "./VerifyEmailClient";

export const metadata: Metadata = {
  title: "Verify your email — Pokhara Tours and Travel",
};

export default function VerifyEmailPage() {
  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-14">
      <Suspense fallback={null}>
        <VerifyEmailClient />
      </Suspense>
    </div>
  );
}
