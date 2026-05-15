import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import ContactForm from "./ContactForm";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Contact us — Pokhara Tours and Travel",
  description:
    "Tell us about your trip. We&rsquo;ll get back to you within a few hours with a tailored itinerary or any answers you need.",
};

const CONTACT_LINES = [
  {
    icon: MapPin,
    label: "Visit",
    value: "Lakeside Road, Pokhara 33700, Nepal",
  },
  {
    icon: Phone,
    label: "Call",
    value: "+977 61 123 4567",
    href: "tel:+97761123456",
  },
  {
    icon: Mail,
    label: "Email",
    value: "hello@pokharatours.com",
    href: "mailto:hello@pokharatours.com",
  },
  {
    icon: Clock,
    label: "Hours",
    value: "Sun–Fri · 9 AM – 7 PM (Nepal time)",
  },
];

export default function ContactPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative h-[40vh] min-h-[320px] w-full overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1565967511849-76a60a516170?auto=format&fit=crop&w=1920&q=75"
          alt="Boats on Phewa Lake at sunset"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/75 via-brand/45 to-black/65" />

        <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-4 text-center text-white">
          <span className="rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-widest backdrop-blur">
            We&apos;d love to hear from you
          </span>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight md:text-5xl">
            Plan your Nepal trip with us
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-white/85 md:text-base">
            Tell us where you want to go and we&apos;ll send a tailored
            itinerary within a few hours.
          </p>
          <nav
            aria-label="breadcrumb"
            className="mt-5 flex items-center gap-1 text-sm text-white/80"
          >
            <Link href="/" className="hover:text-white transition">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">Contact</span>
          </nav>
        </div>
      </section>

      {/* CONTENT */}
      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-5 md:px-8">
          {/* INFO */}
          <aside className="md:col-span-2">
            <span className="text-sm font-semibold uppercase tracking-widest text-brand">
              Get in touch
            </span>
            <h2 className="mt-2 font-display text-2xl font-extrabold leading-tight text-ink md:text-3xl">
              We answer fast — usually within a few hours.
            </h2>
            <p className="mt-3 text-sm text-muted">
              You can drop a message using the form, or reach us directly
              through any of the channels below.
            </p>

            <ul className="mt-6 space-y-4">
              {CONTACT_LINES.map(({ icon: Icon, label, value, href }) => (
                <li key={label} className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                      {label}
                    </p>
                    {href ? (
                      <a
                        href={href}
                        className="text-sm font-semibold text-ink transition hover:text-brand"
                      >
                        {value}
                      </a>
                    ) : (
                      <p className="text-sm font-semibold text-ink">{value}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </aside>

          {/* FORM */}
          <div className="md:col-span-3">
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
