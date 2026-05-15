import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";
import Logo from "./Logo";
import {
  FacebookIcon,
  InstagramIcon,
  TwitterIcon,
  LinkedinIcon,
  YoutubeIcon,
} from "./SocialIcons";

const COMPANY_LINKS = [
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Services" },
  { href: "/destinations", label: "Destinations" },
  { href: "/contact", label: "Contact" },
];

const QUICK_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },

];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink text-white/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 lg:grid-cols-4 md:px-8">
        <div>
          <Logo variant="light" />
          <p className="mt-4 text-sm leading-relaxed">
            Curated journeys through Nepal — Pokhara, Annapurna, Everest, Chitwan,
            Lumbini and beyond. Trusted guides, fair prices, unforgettable memories.
          </p>
          <div className="mt-5 flex gap-3">
            {[
              { icon: FacebookIcon, label: "Facebook" },
              { icon: InstagramIcon, label: "Instagram" },
              { icon: TwitterIcon, label: "Twitter" },
              { icon: LinkedinIcon, label: "LinkedIn" },
              { icon: YoutubeIcon, label: "YouTube" },
            ].map(({ icon: Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 hover:border-brand hover:text-white transition"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-4 font-display text-lg font-semibold text-white">Company</h4>
          <ul className="space-y-2 text-sm">
            {COMPANY_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-brand transition">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-display text-lg font-semibold text-white">Get in touch</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-brand" />
              <span>Lakeside Road, Pokhara 33700, Nepal</span>
            </li>
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 text-brand" />
              <span>+977 61 123 4567</span>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 text-brand" />
              <span>hello@pokharatours.com</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-display text-lg font-semibold text-white">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            {QUICK_LINKS.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="hover:text-brand transition">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <form className="mt-5 flex overflow-hidden rounded-full border border-white/15 bg-white/5">
            <input
              type="email"
              placeholder="Newsletter email"
              className="flex-1 bg-transparent px-4 py-2 text-sm text-white placeholder-white/50 focus:outline-none"
              aria-label="Email for newsletter"
            />
            <button
              type="submit"
              className="bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark transition"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs md:flex-row md:px-8">
          <p>© {year} Pokhara Tours and Travel. All rights reserved.</p>
          <p>
            Made with <span className="text-accent">♥</span> in Nepal
          </p>
        </div>
      </div>
    </footer>
  );
}
