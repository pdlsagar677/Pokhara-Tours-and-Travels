import { z } from "zod";

export const packageFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(120, "Title must be at most 120 characters"),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters"),
  priceNPR: z
    .number({ message: "Price is required" })
    .min(0, "Price must be 0 or more")
    .max(100_000_000, "Price looks too large"),
  isOffer: z.boolean(),
  category: z.enum(["trek", "tour", "adventure", "cultural", "wildlife"]),
});

export type PackageFormInput = z.infer<typeof packageFormSchema>;
