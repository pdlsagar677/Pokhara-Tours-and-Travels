"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Construction, ShieldCheck } from "lucide-react";
import { settingsService } from "@/lib/api/settings.service";
import { useAuthStore } from "@/store/auth.store";
import type { PublicSettings } from "@/types";

const ALWAYS_ALLOWED = ["/admin", "/login"];
const POLL_INTERVAL_MS = 60_000;

function isAllowedPath(pathname: string): boolean {
  return ALWAYS_ALLOWED.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export default function MaintenanceGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";

  const [settings, setSettings] = useState<PublicSettings | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await settingsService.getPublic();
        if (!cancelled) setSettings(data);
      } catch {
        if (!cancelled) {
          setSettings({ maintenanceMode: false, maintenanceMessage: "" });
        }
      }
    };
    load();
    const id = window.setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  // Until we know, render children. The gate is best-effort and shouldn't
  // block initial paint.
  if (!settings) return <>{children}</>;

  // Admins always pass through. Login + admin routes always pass through so
  // an admin can recover from a flipped switch.
  if (isAdmin || isAllowedPath(pathname)) return <>{children}</>;

  // Public site is blocked.
  if (settings.maintenanceMode) {
    return <MaintenanceScreen message={settings.maintenanceMessage} />;
  }

  return <>{children}</>;
}

function MaintenanceScreen({ message }: { message: string }) {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-brand-light via-soft to-white px-4 py-16">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />

      <div className="relative mx-auto w-full max-w-xl rounded-3xl border border-black/5 bg-white p-8 shadow-xl md:p-12">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent">
          <Construction className="h-7 w-7" />
        </span>
        <h1 className="mt-6 font-display text-3xl font-extrabold text-ink md:text-4xl">
          We&apos;ll be right back
        </h1>
        <p className="mt-3 text-sm text-muted md:text-base">
          Pokhara Tours and Travel is temporarily down for scheduled
          maintenance. Bookings, account access and the public site will be
          available again shortly.
        </p>

        {message && (
          <div className="mt-6 rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-ink">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">
              A note from us
            </p>
            <p className="mt-1 leading-relaxed">{message}</p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-white px-5 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand-light"
          >
            <ShieldCheck className="h-4 w-4" />
            Admin sign in
          </Link>
          <a
            href="mailto:hello@pokharatours.com"
            className="text-sm font-semibold text-muted transition hover:text-brand"
          >
            hello@pokharatours.com
          </a>
        </div>
      </div>
    </section>
  );
}
