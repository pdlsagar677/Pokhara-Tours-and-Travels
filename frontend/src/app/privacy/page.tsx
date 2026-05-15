import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  Cookie,
  Database,
  Lock,
  Mail,
  Shield,
  UserCheck,
} from "lucide-react";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Privacy Policy — Pokhara Tours and Travel",
  description:
    "How Pokhara Tours and Travel collects, uses, and protects your personal information when you book a tour or browse our website.",
};

const LAST_UPDATED = "May 2026";

const SECTIONS = [
  {
    icon: Database,
    title: "Information we collect",
    body: [
      "When you create an account, book a trip, or contact us, we collect details such as your full name, email address, phone number, and travel preferences. For bookings we may also collect emergency contact details and dietary or medical information you choose to share.",
      "We collect non-personal information automatically — your browser type, device type, IP address and pages you visit — to keep the site fast, secure and functional.",
    ],
  },
  {
    icon: UserCheck,
    title: "How we use your information",
    body: [
      "We use your information to plan and deliver your trip, communicate with you about your booking, send important pre-departure notes, and respond to enquiries.",
      "If you opt in, we may send occasional newsletters about new destinations or seasonal offers. You can unsubscribe from these at any time using the link in any newsletter email.",
    ],
  },
  {
    icon: Lock,
    title: "How we protect your data",
    body: [
      "Authentication uses industry-standard JWT access tokens and HttpOnly refresh cookies. Passwords are hashed with bcrypt — we never store them in plain text.",
      "Bookings, contact records and account information are stored on managed MongoDB Atlas clusters with encryption in transit and at rest. Only authorised staff can access this data, on a need-to-know basis.",
    ],
  },
  {
    icon: Cookie,
    title: "Cookies and similar technologies",
    body: [
      "We use a single HttpOnly authentication cookie to keep you signed in. We do not use third-party advertising or tracking cookies.",
      "If we add analytics in the future to understand how the site is used, it will be a privacy-respecting solution and disclosed here before deployment.",
    ],
  },
  {
    icon: Shield,
    title: "Sharing with third parties",
    body: [
      "We only share information that is strictly necessary to operate your trip — for example, your name and arrival date with the hotels and lodges where we book your stay, or with the licensed guide assigned to your trip.",
      "We do not sell, rent, or trade your personal information. Where we use third-party processors (email delivery, payment processors), we choose providers with strong privacy practices.",
    ],
  },
  {
    icon: Mail,
    title: "Your rights",
    body: [
      "You can request a copy of the personal data we hold about you, ask us to correct it, or ask us to delete your account at any time. Some records — such as completed booking invoices — may be retained where required by law.",
      "Send any privacy-related request to hello@pokharatours.com and we will respond within a reasonable timeframe.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative h-[40vh] min-h-[320px] w-full overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1606918801925-e2c914c4b503?auto=format&fit=crop&w=1920&q=75"
          alt="Phewa Lake at dawn"
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
            Privacy Policy
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-white/85 md:text-base">
            Plain-English notes on what we collect, why, and how we keep it safe.
          </p>
          <nav
            aria-label="breadcrumb"
            className="mt-5 flex items-center gap-1 text-sm text-white/80"
          >
            <Link href="/" className="hover:text-white transition">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">Privacy</span>
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
            Pokhara Tours and Travel (&ldquo;we&rdquo;, &ldquo;us&rdquo;) takes
            your privacy seriously. This policy explains what data we collect
            when you use our website or book a trip with us, how we use it, and
            the choices you have. If anything here is unclear, write to us at{" "}
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
              Questions about your data?
            </h3>
            <p className="mt-2 text-sm text-muted">
              We&apos;re happy to help. Drop us a line and a real person will
              get back to you.
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
