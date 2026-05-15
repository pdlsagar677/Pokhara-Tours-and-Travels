import { MapPin, Phone, Mail } from "lucide-react";

const CARDS = [
  { icon: MapPin, title: "Office", value: "Lakeside Road, Pokhara, Nepal" },
  { icon: Phone, title: "Mobile", value: "+977 61 123 4567" },
  { icon: Mail, title: "Email", value: "hello@pokharatours.com" },
];

export default function ContactCTA() {
  return (
    <section className="bg-soft py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-brand">
            Get in touch
          </span>
          <h2 className="mt-2 font-display text-3xl font-extrabold leading-tight text-ink md:text-4xl">
            Ready to plan your Nepal adventure?
          </h2>
          <p className="mt-4 text-muted">
            Tell us where you want to go — we&apos;ll reply within a few hours with a custom itinerary.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {CARDS.map(({ icon: Icon, title, value }) => (
            <div
              key={title}
              className="rounded-2xl bg-white p-6 shadow-sm flex items-start gap-4"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-light text-brand">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  {title}
                </p>
                <p className="mt-1 font-medium text-ink">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-black/5 shadow-sm">
            <iframe
              title="Pokhara on Google Maps"
              src="https://www.google.com/maps?q=Pokhara,%20Nepal&output=embed"
              className="h-80 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <form className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Your name"
                className="rounded-xl border border-black/10 px-4 py-3 text-sm focus:border-brand focus:outline-none"
              />
              <input
                type="email"
                placeholder="Email address"
                className="rounded-xl border border-black/10 px-4 py-3 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <input
              type="text"
              placeholder="Subject"
              className="mt-4 w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:border-brand focus:outline-none"
            />
            <textarea
              rows={5}
              placeholder="How can we help?"
              className="mt-4 w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:border-brand focus:outline-none"
            />
            <button
              type="button"
              className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark transition"
            >
              Send message
            </button>
            <p className="mt-2 text-xs text-muted">
              Form is wired in a later step — for now this is layout-only.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
