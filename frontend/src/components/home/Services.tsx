import {
  CalendarCheck,
  Compass,
  ShieldCheck,
  Stamp,
  Mountain,
  Hotel,
  Bus,
  Headphones,
  type LucideIcon,
} from "lucide-react";

type ServiceItem = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const SERVICES: ServiceItem[] = [
  { icon: CalendarCheck, title: "Tour Booking", description: "Seamless booking for tours, treks, and city experiences across Nepal." },
  { icon: Compass, title: "Expert Tour Guides", description: "Licensed local guides who bring every destination to life." },
  { icon: ShieldCheck, title: "Travel Insurance", description: "Comprehensive cover so you can travel worry-free." },
  { icon: Stamp, title: "Visa Assistance", description: "End-to-end help with visas, permits, and travel paperwork." },
  { icon: Mountain, title: "Adventure Tours", description: "Treks, paragliding, rafting, and Himalayan expeditions." },
  { icon: Hotel, title: "Hotel Booking", description: "Hand-picked stays from boutique lodges to luxury resorts." },
  { icon: Bus, title: "Private Transport", description: "Reliable airport pickups, intercity transfers, and tour vehicles." },
  { icon: Headphones, title: "24/7 Support", description: "On-trip support around the clock — wherever you are in Nepal." },
];

export default function Services() {
  return (
    <section className="bg-soft py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-brand">
            Our services
          </span>
          <h2 className="mt-2 font-display text-3xl font-extrabold leading-tight text-ink md:text-4xl">
            Everything you need for a perfect trip
          </h2>
          <p className="mt-4 text-muted">
            From the first idea to the journey home — we handle every detail so you can simply enjoy.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-brand/30 hover:shadow-md"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light text-brand transition group-hover:bg-brand group-hover:text-white">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 font-display text-lg font-bold text-ink">{title}</h3>
              <p className="mt-2 text-sm text-muted">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
