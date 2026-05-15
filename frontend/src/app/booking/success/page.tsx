import type { Metadata } from "next";
import { Suspense } from "react";
import SuccessClient from "./SuccessClient";

export const metadata: Metadata = {
  title: "Payment confirmed — Pokhara Tours and Travel",
};

export default function BookingSuccessPage() {
  return (
    <div className="bg-soft min-h-[calc(100vh-5rem)]">
      <Suspense fallback={null}>
        <SuccessClient />
      </Suspense>
    </div>
  );
}
