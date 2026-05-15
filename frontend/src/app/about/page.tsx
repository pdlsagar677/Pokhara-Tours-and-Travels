import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  Compass,
  Heart,
  Leaf,
  Mountain,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "About us — Pokhara Tours and Travel",
  description:
    "Learn about Pokhara Tours and Travel — a Nepali-owned travel company crafting authentic journeys around Phewa Lake, the Annapurnas and beyond.",
};

const VALUES = [
  {
    icon: Heart,
    title: "Local at heart",
    text: "Born and raised in Pokhara. Every itinerary is shaped by guides who grew up beside Phewa lake.",
  },
  {
    icon: Leaf,
    title: "Travel with purpose",
    text: "We work with family-run tea houses and community lodges so the money stays in Nepali hands.",
  },
  {
    icon: ShieldCheck,
    title: "Safety first",
    text: "Licensed guides, vetted vehicles, comprehensive insurance, and 24/7 support on every trip.",
  },
  {
    icon: Sparkles,
    title: "Tailor-made",
    text: "From a quiet lakeside getaway to a 21-day Annapurna circuit — we shape the trip around you.",
  },
];

const STATS = [
  { value: "12+", label: "Years guiding" },
  { value: "8,400", label: "Happy travellers" },
  { value: "35", label: "Destinations covered" },
  { value: "26", label: "Licensed local guides" },
];

const GALLERY = [
  {
    src: "https://images.unsplash.com/photo-1605640840605-14ac1855827b?auto=format&fit=crop&w=1400&q=80",
    alt: "Phewa Lake reflecting the Annapurna range",
    caption: "Phewa Lake at sunrise",
  },
  {
    src: "https://images.unsplash.com/photo-1565967511849-76a60a516170?auto=format&fit=crop&w=1200&q=80",
    alt: "Boats on Phewa lake near Pokhara",
    caption: "Lakeside, Pokhara",
  },
  {
    src: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80",
    alt: "Annapurna mountain range",
    caption: "Annapurna at first light",
  },
  {
    src: "https://images.unsplash.com/photo-1571401835393-8c5f35328320?auto=format&fit=crop&w=1200&q=80",
    alt: "Trekkers near a Pokhara viewpoint",
    caption: "Sarangkot viewpoint",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative h-[60vh] min-h-[420px] w-full overflow-hidden">
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
            About us
          </span>
          <h1 className="animate-slide-in-down mt-5 font-display text-4xl font-extrabold leading-tight md:text-6xl">
            Stories from the <span className="text-accent">heart of Nepal</span>
          </h1>
          <p className="animate-fade-in-up mt-5 max-w-2xl text-base text-white/85 md:text-lg">
            We&apos;re a small Pokhara-based team turning every journey into a
            memory worth keeping.
          </p>
          <nav
            aria-label="breadcrumb"
            className="animate-fade-in-up mt-6 flex items-center gap-1 text-sm text-white/80"
          >
            <Link href="/" className="hover:text-white transition">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">About</span>
          </nav>
        </div>
      </section>

      {/* OUR STORY */}
      <section className="bg-white py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 md:grid-cols-2 md:items-center md:px-8">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-xl">
            <Image
              src="https://images.unsplash.com/photo-1606918801925-e2c914c4b503?auto=format&fit=crop&w=1200&q=80"
              alt="Phewa lake from the Pokhara shore"
              fill
              className="object-cover"
            />
            <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/95 backdrop-blur p-4 shadow-md">
              <p className="font-display text-sm font-bold text-ink">
                Lakeside, Pokhara · since 2012
              </p>
              <p className="text-xs text-muted">
                Where every itinerary starts with a cup of milk tea.
              </p>
            </div>
          </div>

          <div>
            <span className="text-sm font-semibold uppercase tracking-widest text-brand">
              Our story
            </span>
            <h2 className="mt-2 font-display text-3xl font-extrabold leading-tight text-ink md:text-4xl">
              From a small lakeside office to journeys across Nepal
            </h2>
            <div className="mt-5 space-y-4 text-base leading-relaxed text-muted">
              <p>
                Pokhara Tours and Travel started in a one-room office on
                Lakeside Road, looking out over Phewa lake and the Annapurnas.
                What began as friends helping friends find a guide grew into a
                full-service travel company that now runs trips across the
                country.
              </p>
              <p>
                We&apos;re still small enough that the founders answer the phone
                — and small enough to design every itinerary from scratch. Our
                guides are licensed locals who know the difference between a
                postcard view and the place a traveller will actually remember.
              </p>
              <p>
                Whether you&apos;re here for a quiet weekend by the lake, the
                Annapurna circuit, or a once-in-a-lifetime trek to Everest base
                camp — we&apos;d love to plan it with you.
              </p>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/destinations"
                className="inline-flex items-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark transition"
              >
                Explore destinations
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center rounded-full border border-brand/30 px-6 py-3 text-sm font-semibold text-brand hover:bg-brand-light transition"
              >
                Talk to us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="bg-gradient-to-br from-brand to-brand-dark py-14">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map(({ value, label }) => (
              <div
                key={label}
                className="rounded-2xl bg-white/10 px-6 py-5 text-center backdrop-blur"
              >
                <p className="font-display text-3xl font-extrabold text-white md:text-4xl">
                  {value}
                </p>
                <p className="mt-1 text-sm text-white/80">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="bg-soft py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-brand">
              What we stand for
            </span>
            <h2 className="mt-2 font-display text-3xl font-extrabold leading-tight text-ink md:text-4xl">
              Travel that gives back, every step of the way
            </h2>
            <p className="mt-4 text-muted">
              Four principles guide every itinerary we put together.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="group rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-brand/30 hover:shadow-md"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light text-brand transition group-hover:bg-brand group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-ink">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-brand">
              Through our lens
            </span>
            <h2 className="mt-2 font-display text-3xl font-extrabold leading-tight text-ink md:text-4xl">
              Postcards from Phewa lake and beyond
            </h2>
            <p className="mt-4 text-muted">
              A few of the views our travellers won&apos;t stop talking about.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {GALLERY.map(({ src, alt, caption }) => (
              <figure
                key={alt}
                className="group relative aspect-[3/4] overflow-hidden rounded-2xl shadow-sm"
              >
                <Image
                  src={src}
                  alt={alt}
                  fill
                  sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
                  className="object-cover transition duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <figcaption className="absolute bottom-3 left-4 right-4 text-sm font-semibold text-white">
                  {caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* WHO WE ARE STRIP */}
      <section className="bg-soft py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <span className="text-sm font-semibold uppercase tracking-widest text-brand">
                The team
              </span>
              <h2 className="mt-2 font-display text-3xl font-extrabold leading-tight text-ink md:text-4xl">
                Guides, planners, and storytellers
              </h2>
              <p className="mt-4 text-muted">
                A compact team of locals — every guide licensed, every planner
                a traveller themselves.
              </p>
            </div>

            <div className="lg:col-span-2 grid gap-4 sm:grid-cols-3">
              <TeamCard
                icon={Compass}
                role="Guides"
                blurb="26 licensed Nepali guides specialising in trekking, culture and wildlife tours."
              />
              <TeamCard
                icon={Users}
                role="Planners"
                blurb="A team that designs every itinerary by hand — not from a template."
              />
              <TeamCard
                icon={Mountain}
                role="On-trip support"
                blurb="A 24/7 in-country line so you&rsquo;re never alone on the trail."
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-ink">
        <div className="absolute inset-0 opacity-30">
          <Image
            src="https://images.unsplash.com/photo-1605640840605-14ac1855827b?auto=format&fit=crop&w=1920&q=70"
            alt=""
            fill
            className="object-cover"
          />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 py-20 text-center text-white md:px-8">
          <h2 className="font-display text-3xl font-extrabold leading-tight md:text-4xl">
            Let&apos;s plan your Nepal story together
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/80">
            Tell us where you want to go, how long you have, and what kind of
            trip you&apos;re dreaming of. We&apos;ll send a tailored itinerary
            within a few hours.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center rounded-full bg-accent px-6 py-3 text-sm font-bold text-white shadow-sm hover:brightness-110 transition"
            >
              Start planning
            </Link>
            <Link
              href="/destinations"
              className="inline-flex items-center rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              See destinations
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function TeamCard({
  icon: Icon,
  role,
  blurb,
}: {
  icon: React.ComponentType<{ className?: string }>;
  role: string;
  blurb: string;
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 font-display text-sm font-bold text-ink">{role}</p>
      <p className="mt-1 text-sm text-muted">{blurb}</p>
    </div>
  );
}
