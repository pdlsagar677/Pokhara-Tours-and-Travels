import type { Metadata } from "next";
import { Suspense } from "react";
import FailureClient from "./FailureClient";

export const metadata: Metadata = {
  title: "Payment didn't go through — Pokhara Tours and Travel",
};

export default function BookingFailurePage() {
  return (
    <div className="bg-soft min-h-[calc(100vh-5rem)]">
      <Suspense fallback={null}>
        <FailureClient />
      </Suspense>
    </div>
  );
}
