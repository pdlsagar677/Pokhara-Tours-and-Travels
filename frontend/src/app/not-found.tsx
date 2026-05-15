import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Compass, Home, MapPin } from "lucide-react";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Page not found — Pokhara Tours and Travel",
  description:
    "The trail you took has gone cold. Head back to base camp and start a new journey with Pokhara Tours and Travel.",
};

export default function NotFound() {
  return (
    <section className="relative min-h-[80vh] overflow-hidden bg-soft">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1605640840605-14ac1855827b?auto=format&fit=crop&w=1920&q=70"
          alt=""
          fill
          priority
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/50 to-white" />
      </div>

      <div className="relative mx-auto flex min-h-[80vh] max-w-3xl flex-col items-center justify-center px-4 py-20 text-center md:px-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-white/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand backdrop-blur">
          <Compass className="h-3.5 w-3.5" />
          Off the trail
        </span>

        <h1 className="mt-5 font-display text-7xl font-extrabold leading-none text-brand md:text-9xl">
          404
        </h1>
        <h2 className="mt-4 font-display text-2xl font-extrabold text-ink md:text-4xl">
          This trail doesn&apos;t lead anywhere
        </h2>
        <p className="mt-4 max-w-xl text-base text-muted md:text-lg">
          The page you&apos;re looking for might have been moved, renamed, or
          never existed at all. Let&apos;s get you back to a familiar path.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
          >
            <Home className="h-4 w-4" />
            Back to home
          </Link>
          <Link
            href="/destinations"
            className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-white px-6 py-3 text-sm font-semibold text-brand transition hover:bg-brand-light"
          >
            <MapPin className="h-4 w-4" />
            Browse destinations
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-muted transition hover:text-brand"
          >
            <ArrowLeft className="h-4 w-4" />
            Or talk to us
          </Link>
        </div>

        <p className="mt-12 text-xs text-muted">
          Lost something specific? Drop us a line at{" "}
          <a
            href="mailto:hello@pokharatours.com"
            className="font-semibold text-brand hover:text-brand-dark"
          >
            hello@pokharatours.com
          </a>{" "}
          and we&apos;ll help you find it.
        </p>
      </div>
    </section>
  );
}
