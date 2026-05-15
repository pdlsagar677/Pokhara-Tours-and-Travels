import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

const BENEFITS = [
  "Local Nepali guides with 10+ years of experience",
  "Hand-picked accommodations on every itinerary",
  "Transparent pricing — no hidden fees",
  "Customizable packages to match your pace",
  "24/7 in-country support during your trip",
  "Sustainable, community-first travel",
];

export default function About() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 md:grid-cols-2 md:items-center md:px-8">
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-xl">
          <Image
            src="https://images.unsplash.com/photo-1571401835393-8c5f35328320?auto=format&fit=crop&w=1200&q=80"
            alt="Trekkers near a Pokhara viewpoint"
            fill
            className="object-cover"
          />
        </div>

        <div>
          <span className="text-sm font-semibold uppercase tracking-widest text-brand">
            About us
          </span>
          <h2 className="mt-2 font-display text-3xl font-extrabold leading-tight text-ink md:text-4xl">
            Your trusted partner for unforgettable Nepal journeys
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted">
            We&apos;ve guided thousands of travellers across Nepal&apos;s most iconic landscapes —
            from gentle lakeside strolls in Pokhara to high-altitude crossings in the
            Himalayas. Our small, expert team designs every trip around you.
          </p>
          <ul className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-ink">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
