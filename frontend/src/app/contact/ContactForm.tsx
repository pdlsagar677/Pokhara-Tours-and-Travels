"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import {
  contactFormSchema,
  type ContactFormInput,
} from "@/lib/validators/contact.schema";
import { contactService } from "@/lib/api/contact.service";
import { extractApiError } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth.store";

export default function ContactForm() {
  const user = useAuthStore((s) => s.user);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormInput>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      subject: "",
      message: "",
    },
  });

  // Sync prefill when user hydrates after the form is mounted.
  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        subject: "",
        message: "",
      });
    }
  }, [user, reset]);

  const onSubmit = async (values: ContactFormInput) => {
    setServerError(null);
    try {
      await contactService.submit(values);
      setSubmitted(true);
      reset();
    } catch (err) {
      setServerError(extractApiError(err, "Could not send your message"));
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center shadow-sm">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-700">
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <h3 className="mt-4 font-display text-xl font-bold text-ink">
          Message received
        </h3>
        <p className="mt-2 text-sm text-muted">
          Thanks for reaching out — we&apos;ll get back to you within a few
          hours, usually faster.
        </p>
        {user && (
          <p className="mt-2 text-xs text-muted">
            You can track this conversation in your{" "}
            <Link
              href="/profile"
              className="font-semibold text-brand hover:text-brand-dark"
            >
              profile messages
            </Link>
            .
          </p>
        )}
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-5 inline-flex items-center gap-1 rounded-full border border-brand/30 px-5 py-2 text-sm font-semibold text-brand transition hover:bg-brand-light"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 rounded-2xl border border-black/5 bg-white p-6 shadow-sm md:p-8"
      noValidate
    >
      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="text-sm font-medium text-ink">
            Name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Your full name"
            className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:border-brand focus:outline-none"
            {...register("name")}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:border-brand focus:outline-none"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="text-sm font-medium text-ink">
          Subject
        </label>
        <input
          id="subject"
          type="text"
          placeholder="Annapurna Base Camp — late October"
          className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:border-brand focus:outline-none"
          {...register("subject")}
        />
        {errors.subject && (
          <p className="mt-1 text-xs text-red-600">{errors.subject.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="message" className="text-sm font-medium text-ink">
          Message
        </label>
        <textarea
          id="message"
          rows={6}
          placeholder="Tell us a bit about the trip you're dreaming of — dates, group size, anything special you'd like included."
          className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:border-brand focus:outline-none"
          {...register("message")}
        />
        {errors.message && (
          <p className="mt-1 text-xs text-red-600">{errors.message.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted">
          We&apos;ll only use these details to respond to your message.
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Send message
        </button>
      </div>
    </form>
  );
}
