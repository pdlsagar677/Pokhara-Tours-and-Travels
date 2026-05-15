import { z } from "zod";

export const chatInputSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Type a message")
    .max(500, "Keep it under 500 characters"),
});

export type ChatInput = z.infer<typeof chatInputSchema>;

export const searchInputSchema = z.object({
  query: z
    .string()
    .trim()
    .min(2, "Describe what you're looking for")
    .max(200, "Shorten your query"),
});

export type SearchInput = z.infer<typeof searchInputSchema>;
