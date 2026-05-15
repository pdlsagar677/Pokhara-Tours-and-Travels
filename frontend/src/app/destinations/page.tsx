import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import DestinationsClient from "./DestinationsClient";

export const metadata: Metadata = {
  title: "Destinations & packages — Pokhara Tours and Travel",
  description:
    "Browse all tour packages across Nepal — Pokhara, Annapurna, Everest, Chitwan and more.",
};

export default function DestinationsPage() {
  return (
    <>
      <section className="relative h-[50vh] min-h-[360px] w-full overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1605640840605-14ac1855827b?auto=format&fit=crop&w=1920&q=80"
          alt="Phewa Lake and the Annapurna range"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/70 via-brand/40 to-black/60" />

        <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-4 text-center text-white">
          <span className="animate-slide-in-down rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-widest backdrop-blur">
            Destinations
          </span>
          <h1 className="animate-slide-in-down mt-5 font-display text-4xl font-extrabold leading-tight md:text-5xl">
            Tours and packages across Nepal
          </h1>
          <nav
            aria-label="breadcrumb"
            className="animate-fade-in-up mt-5 flex items-center gap-1 text-sm text-white/80"
          >
            <Link href="/" className="hover:text-white transition">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">Destinations</span>
          </nav>
        </div>
      </section>

      <section className="bg-soft py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <DestinationsClient filterType="destination" />
        </div>
      </section>
    </>
  );
}
