import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarX,
  ChevronRight,
  CreditCard,
  FileText,
  HeartPulse,
  Scale,
  Users,
} from "lucide-react";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Terms of Service — Pokhara Tours and Travel",
  description:
    "Read the terms that apply when you book a tour, create an account, or use the Pokhara Tours and Travel website.",
};

const LAST_UPDATED = "May 2026";

const SECTIONS = [
  {
    icon: FileText,
    title: "Acceptance of terms",
    body: [
      "By creating an account, booking a trip, or otherwise using the Pokhara Tours and Travel website (the “Service”), you agree to these Terms of Service. If you do not agree, please do not use the Service.",
      "We may update these terms from time to time. The current version is always posted on this page with a revision date.",
    ],
  },
  {
    icon: Users,
    title: "Your account",
    body: [
      "You are responsible for keeping your account credentials safe and for any activity under your account. Use a strong password and let us know immediately if you suspect unauthorised access.",
      "You must be at least 18 years old to create an account or make a booking. Travellers under 18 may join a trip when accompanied by a parent or legal guardian who has booked on their behalf.",
    ],
  },
  {
    icon: CreditCard,
    title: "Bookings, deposits, and payment",
    body: [
      "All prices are quoted in Nepali Rupees (NPR) and apply per traveller unless stated otherwise. Children aged 12 and under travel at 50% of the adult rate when sharing accommodation with parents.",
      "Bookings can be made with an advance payment or marked as “pay on arrival” depending on the option you choose at checkout. A booking is only confirmed once payment status is updated by our team.",
      "Final balances must be settled before the trip start date. We reserve the right to release a booking if payment is not received in time.",
    ],
  },
  {
    icon: CalendarX,
    title: "Cancellations and refunds",
    body: [
      "Cancellations made more than 30 days before departure are eligible for a full refund minus any non-recoverable third-party costs (permit fees, internal flight tickets).",
      "Cancellations between 14 and 30 days before departure are eligible for a 50% refund. Within 14 days, no refund is available, though we will always try to credit your booking towards a future trip.",
      "If we have to cancel a trip due to weather, political situations, or events beyond our control, we will offer the choice of a full refund or rescheduling at no extra cost.",
    ],
  },
  {
    icon: HeartPulse,
    title: "Traveller responsibilities",
    body: [
      "You are responsible for ensuring you have valid travel documents (passport, visa, permits where applicable) and adequate travel insurance covering medical evacuation, especially for trekking trips.",
      "Please disclose any medical conditions or dietary requirements when booking. High-altitude treks come with inherent risks; you must follow the guide’s instructions and trek within your capability.",
    ],
  },
  {
    icon: AlertTriangle,
    title: "Limitations of liability",
    body: [
      "While we plan trips carefully and work with licensed guides and vetted partners, we cannot be held liable for events outside our control — weather, road conditions, government actions, or third-party service disruptions.",
      "Our total liability for any claim arising from a booking is limited to the amount you paid for that booking. This does not exclude any rights you have under applicable law.",
    ],
  },
  {
    icon: Scale,
    title: "Governing law",
    body: [
      "These terms are governed by the laws of Nepal. Any disputes will be resolved in the courts of Kaski District, Pokhara, unless otherwise agreed in writing.",
    ],
  },
];

export default function TermsPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative h-[40vh] min-h-[320px] w-full overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1920&q=75"
          alt="Annapurna mountain range at sunrise"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/75 via-brand/45 to-black/65" />

        <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-4 text-center text-white">
          <span className="rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-widest backdrop-blur">
            Legal
          </span>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight md:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-white/85 md:text-base">
            The rules of the road when you travel with us.
          </p>
          <nav
            aria-label="breadcrumb"
            className="mt-5 flex items-center gap-1 text-sm text-white/80"
          >
            <Link href="/" className="hover:text-white transition">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">Terms</span>
          </nav>
        </div>
      </section>

      {/* CONTENT */}
      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            Last updated · {LAST_UPDATED}
          </p>
          <p className="mt-4 text-base leading-relaxed text-muted">
            These terms describe the agreement between you and Pokhara Tours
            and Travel when you use our website or book a trip. We&apos;ve
            kept them as plain as we can. If you have questions, write to us
            at{" "}
            <a
              href="mailto:hello@pokharatours.com"
              className="font-semibold text-brand hover:text-brand-dark"
            >
              hello@pokharatours.com
            </a>
            .
          </p>

          <div className="mt-12 space-y-10">
            {SECTIONS.map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition hover:border-brand/20 hover:shadow-md md:p-8"
              >
                <div className="flex items-start gap-4">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="flex-1">
                    <h2 className="font-display text-xl font-bold text-ink md:text-2xl">
                      {title}
                    </h2>
                    <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted md:text-base">
                      {body.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-14 rounded-2xl bg-soft p-6 text-center md:p-8">
            <h3 className="font-display text-lg font-bold text-ink">
              Need clarification?
            </h3>
            <p className="mt-2 text-sm text-muted">
              These terms shouldn&apos;t feel like a maze. If anything is
              unclear, we&apos;re a message away.
            </p>
            <Link
              href="/contact"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
