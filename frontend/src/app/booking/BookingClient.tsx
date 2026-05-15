"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  ChevronLeft,
  Loader2,
} from "lucide-react";

import { useAuthStore } from "@/store/auth.store";
import { packagesService } from "@/lib/api/packages.service";
import { bookingsService } from "@/lib/api/bookings.service";
import { extractApiError } from "@/lib/api/client";
import { formatNPR } from "@/lib/utils";
import {
  bookingFormSchema,
  type BookingFormInput,
} from "@/lib/validators/booking.schema";
import type { Booking, Package } from "@/types";

import DateField from "@/components/booking/DateField";
import TravelerCounter from "@/components/booking/TravelerCounter";
import PaymentMethodSelect from "@/components/booking/PaymentMethodSelect";
import BookingSummary from "@/components/booking/BookingSummary";
import EsewaPayButton from "@/components/booking/EsewaPayButton";

export default function BookingClient() {
  const router = useRouter();
  const search = useSearchParams();
  const slug = search.get("package") || "";

  const user = useAuthStore((s) => s.user);

  const [pkg, setPkg] = useState<Package | null>(null);
  const [pkgLoading, setPkgLoading] = useState(true);
  const [pkgError, setPkgError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [created, setCreated] = useState<Booking | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormInput>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      packageSlug: "",
      startDate: "",
      adults: 1,
      children: 0,
      contact: { name: "", email: "", phone: "" },
      paymentMethod: "on_arrival",
      notes: "",
    },
  });

  // Load package
  useEffect(() => {
    if (!slug) {
      setPkgError("No package selected. Pick one from the destinations page.");
      setPkgLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const p = await packagesService.getBySlug(slug);
        if (cancelled) return;
        setPkg(p);
        setValue("packageSlug", p.slug);
      } catch (err) {
        if (!cancelled) setPkgError(extractApiError(err, "Could not load package"));
      } finally {
        if (!cancelled) setPkgLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, setValue]);

  // Pre-fill contact once user is hydrated
  useEffect(() => {
    if (!user) return;
    setValue("contact.name", user.name);
    setValue("contact.email", user.email);
    setValue("contact.phone", user.phone);
  }, [user, setValue]);

  const adults = watch("adults");
  const children = watch("children");

  const onSubmit = async (values: BookingFormInput) => {
    setServerError(null);
    try {
      const booking = await bookingsService.create({
        packageSlug: values.packageSlug,
        startDate: values.startDate,
        travelers: { adults: values.adults, children: values.children },
        contact: values.contact,
        paymentMethod: values.paymentMethod,
        notes: values.notes || undefined,
      });
      setCreated(booking);
    } catch (err) {
      setServerError(extractApiError(err, "Could not create booking"));
    }
  };

  // States: loading, error, success, form
  if (pkgLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (pkgError || !pkg) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-8">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
          <h1 className="font-display text-xl font-bold text-red-800">
            Couldn&apos;t load this trip
          </h1>
          <p className="mt-2 text-sm text-red-700">{pkgError}</p>
          <Link
            href="/destinations"
            className="mt-5 inline-flex items-center gap-1 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark transition"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to destinations
          </Link>
        </div>
      </div>
    );
  }

  if (created) {
    return (
      <div className="bg-soft min-h-[calc(100vh-5rem)]">
        <div className="mx-auto max-w-3xl px-4 py-14 md:px-8">
          <div className="rounded-3xl border border-black/5 bg-white p-8 shadow-sm md:p-10">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="mt-5 text-center font-display text-2xl font-extrabold text-ink md:text-3xl">
              Booking confirmed!
            </h1>
            <p className="mt-2 text-center text-sm text-muted">
              Your booking reference is{" "}
              <span className="font-mono font-semibold text-ink">{created.id}</span>.
              We&apos;ve saved it to your profile.
            </p>

            <dl className="mt-7 grid gap-3 rounded-2xl bg-soft p-5 text-sm sm:grid-cols-2">
              <Row label="Package" value={created.packageSnapshot?.title || created.packageSlug} />
              <Row
                label="Start date"
                value={new Date(created.startDate).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              />
              <Row
                label="Travelers"
                value={`${created.travelers.adults} adult${
                  created.travelers.adults === 1 ? "" : "s"
                }${
                  created.travelers.children
                    ? `, ${created.travelers.children} child${
                        created.travelers.children === 1 ? "" : "ren"
                      }`
                    : ""
                }`}
              />
              <Row label="Total" value={formatNPR(created.totalNPR)} highlight />
              <Row
                label="Payment"
                value={
                  created.paymentMethod === "advance"
                    ? "Advance reservation"
                    : "Pay on arrival"
                }
              />
              <Row label="Status" value={created.status} />
            </dl>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/profile"
                className="inline-flex items-center rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark transition"
              >
                View my bookings
              </Link>
              <Link
                href="/destinations"
                className="inline-flex items-center rounded-full border border-brand/30 px-6 py-2.5 text-sm font-semibold text-brand hover:bg-brand-light transition"
              >
                Browse more trips
              </Link>
            </div>

            {created.paymentMethod === "advance" &&
            created.paymentStatus !== "paid" ? (
              <div className="mt-6 rounded-xl border border-brand-light bg-brand-light/40 p-4">
                <p className="text-center text-xs text-brand-dark">
                  Pay your deposit online with eSewa, or we&apos;ll reach out
                  within 24 hours to arrange it.
                </p>
                <div className="mt-3">
                  <EsewaPayButton bookingId={created.id} />
                </div>
              </div>
            ) : created.paymentMethod === "on_arrival" ? (
              <p className="mt-6 rounded-xl bg-soft px-4 py-3 text-center text-xs text-muted">
                Bring the full amount with you on arrival in Pokhara.
              </p>
            ) : (
              <p className="mt-6 rounded-xl bg-green-50 px-4 py-3 text-center text-xs text-green-800">
                Payment received. We&apos;ll be in touch shortly.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-soft min-h-[calc(100vh-5rem)]">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <header className="mb-8">
          <h1 className="font-display text-3xl font-extrabold text-ink md:text-4xl">
            Book your trip
          </h1>
          <p className="mt-1 text-sm text-muted">
            A few details and you&apos;re ready to go.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr,360px]">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-8"
            noValidate
          >
            {serverError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

            {/* Section: Date */}
            <Section
              title="When do you want to travel?"
              description="Pick the start date — we'll confirm availability after you submit."
            >
              <DateField
                {...register("startDate")}
                error={errors.startDate?.message}
              />
            </Section>

            {/* Section: Travelers */}
            <Section
              title="Travelers"
              description="Children are billed at 50% of the adult price."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Controller
                  control={control}
                  name="adults"
                  render={({ field }) => (
                    <TravelerCounter
                      label="Adults"
                      hint="Age 13+"
                      value={field.value}
                      onChange={field.onChange}
                      min={1}
                      max={20}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="children"
                  render={({ field }) => (
                    <TravelerCounter
                      label="Children"
                      hint="Age 2–12"
                      value={field.value}
                      onChange={field.onChange}
                      min={0}
                      max={20}
                    />
                  )}
                />
              </div>
              {(errors.adults || errors.children) && (
                <p className="mt-2 text-xs text-red-600">
                  {errors.adults?.message || errors.children?.message}
                </p>
              )}
            </Section>

            {/* Section: Contact */}
            <Section
              title="Contact details"
              description="We'll use these to reach you about your booking."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Full name"
                  error={errors.contact?.name?.message}
                  inputProps={{
                    type: "text",
                    autoComplete: "name",
                    ...register("contact.name"),
                  }}
                />
                <Field
                  label="Phone"
                  error={errors.contact?.phone?.message}
                  inputProps={{
                    type: "tel",
                    autoComplete: "tel",
                    ...register("contact.phone"),
                  }}
                />
              </div>
              <Field
                label="Email"
                error={errors.contact?.email?.message}
                inputProps={{
                  type: "email",
                  autoComplete: "email",
                  ...register("contact.email"),
                }}
              />
            </Section>

            {/* Section: Payment */}
            <Section
              title="How would you like to pay?"
              description="No money is charged now — both options simply reserve your spot."
            >
              <Controller
                control={control}
                name="paymentMethod"
                render={({ field }) => (
                  <PaymentMethodSelect
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.paymentMethod?.message}
                  />
                )}
              />
            </Section>

            {/* Section: Notes */}
            <Section
              title="Anything special we should know? (optional)"
              description="Allergies, anniversaries, accessibility needs — anything helpful."
            >
              <textarea
                rows={4}
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm focus:border-brand focus:outline-none"
                placeholder="e.g. vegetarian meals, knee injury, prefer ground-floor rooms…"
                {...register("notes")}
              />
              {errors.notes && (
                <p className="mt-1 text-xs text-red-600">{errors.notes.message}</p>
              )}
            </Section>

            <div className="flex items-center justify-end gap-3 border-t border-black/10 pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-7 py-3 text-sm font-bold text-white shadow-sm hover:bg-brand-dark transition disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm booking
              </button>
            </div>
          </form>

          <BookingSummary pkg={pkg} adults={adults || 1} children={children || 0} />
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <header className="mb-4">
        <h2 className="font-display text-base font-bold text-ink">{title}</h2>
        {description && <p className="mt-1 text-xs text-muted">{description}</p>}
      </header>
      {children}
    </section>
  );
}

function Field({
  label,
  error,
  inputProps,
}: {
  label: string;
  error?: string;
  inputProps: React.InputHTMLAttributes<HTMLInputElement> & { ref?: React.Ref<HTMLInputElement> };
}) {
  return (
    <div>
      <label className="text-sm font-medium text-ink">{label}</label>
      <input
        {...inputProps}
        className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:border-brand focus:outline-none"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p
        className={`mt-1 text-sm capitalize ${
          highlight ? "font-display text-base font-extrabold text-ink" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
