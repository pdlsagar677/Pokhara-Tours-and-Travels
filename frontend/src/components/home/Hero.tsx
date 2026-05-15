import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative h-[78vh] min-h-[520px] w-full overflow-hidden">
      <Image
        src="https://images.unsplash.com/photo-1605640840605-14ac1855827b?auto=format&fit=crop&w=1920&q=80"
        alt="Phewa Lake and the Annapurna range, Pokhara"
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/60" />

      <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-4 text-center text-white">
        <span className="animate-slide-in-down rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-widest backdrop-blur">
          Welcome to Nepal
        </span>
        <h1 className="animate-slide-in-down mt-5 font-display text-4xl font-extrabold leading-tight md:text-6xl">
          Discover the Heart of <span className="text-accent">Nepal</span>
        </h1>
        <p className="animate-fade-in-up mt-5 max-w-2xl text-base text-white/85 md:text-lg">
          From the serene Phewa lake to the towering Annapurnas — let us craft a journey
          you&apos;ll remember for a lifetime.
        </p>

        <form
          action="/destinations"
          className="animate-fade-in-up mt-8 flex w-full max-w-xl items-center overflow-hidden rounded-full bg-white p-1.5 shadow-lg"
        >
          <input
            name="q"
            type="text"
            placeholder="Where do you want to go? e.g. Pokhara"
            className="flex-1 bg-transparent px-5 py-2.5 text-sm text-ink placeholder-muted focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark transition"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
        </form>

        <div className="animate-fade-in-up mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
          <Link
            href="/destinations"
            className="rounded-full bg-white px-5 py-2 font-semibold text-ink hover:bg-white/90 transition"
          >
            Explore Destinations
          </Link>
          <Link
            href="/contact"
            className="rounded-full border border-white/60 px-5 py-2 font-semibold text-white hover:bg-white/10 transition"
          >
            Talk to a Specialist
          </Link>
        </div>
      </div>
    </section>
  );
}
