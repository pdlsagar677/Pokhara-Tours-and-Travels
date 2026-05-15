"use client";

import { CreditCard, Wallet, Check } from "lucide-react";
import type { PaymentMethod } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  value: PaymentMethod | "";
  onChange: (v: PaymentMethod) => void;
  error?: string;
};

const OPTIONS: {
  value: PaymentMethod;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}[] = [
  {
    value: "advance",
    icon: CreditCard,
    title: "Advance reservation",
    description:
      "Hold your spot now. Our team will contact you within 24 hours to arrange the deposit.",
  },
  {
    value: "on_arrival",
    icon: Wallet,
    title: "Pay on arrival",
    description: "Reserve now, pay in full when you arrive in Pokhara.",
  },
];

export default function PaymentMethodSelect({ value, onChange, error }: Props) {
  return (
    <div>
      <p className="text-sm font-medium text-ink">Payment method</p>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((opt) => {
          const active = opt.value === value;
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={active}
              className={cn(
                "relative flex h-full flex-col items-start gap-3 rounded-2xl border p-4 text-left transition",
                active
                  ? "border-brand bg-brand-light shadow-sm"
                  : "border-black/10 bg-white hover:border-brand/40 hover:bg-soft"
              )}
            >
              <span
                className={cn(
                  "inline-flex h-10 w-10 items-center justify-center rounded-xl transition",
                  active ? "bg-brand text-white" : "bg-brand-light text-brand"
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-sm font-bold text-ink">{opt.title}</p>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  {opt.description}
                </p>
              </div>
              {active && (
                <span className="absolute right-3 top-3 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
