import { z } from "zod";

function todayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export const bookingFormSchema = z.object({
  packageSlug: z.string().trim().min(1, "Package is required"),
  startDate: z
    .string()
    .min(1, "Pick a start date")
    .refine((v) => !Number.isNaN(new Date(v).getTime()), "Invalid date")
    .refine((v) => v >= todayISO(), "Date cannot be in the past"),
  adults: z
    .number({ message: "Adults is required" })
    .int()
    .min(1, "At least 1 adult")
    .max(20, "At most 20 adults"),
  children: z
    .number()
    .int()
    .min(0)
    .max(20, "At most 20 children"),
  contact: z.object({
    name: z.string().trim().min(2, "Name is required"),
    email: z.string().trim().email("Enter a valid email"),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9][0-9\-\s()]{5,19}$/, "Enter a valid phone number"),
  }),
  paymentMethod: z.enum(["advance", "on_arrival"], {
    message: "Choose a payment method",
  }),
  notes: z.string().trim().max(1000, "Keep notes under 1000 characters").optional(),
});

export type BookingFormInput = z.infer<typeof bookingFormSchema>;
