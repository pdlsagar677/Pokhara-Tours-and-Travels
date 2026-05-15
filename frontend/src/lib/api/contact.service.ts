import { apiClient } from "./client";
import type { ContactFormInput } from "@/lib/validators/contact.schema";
import type { ContactMessage } from "@/types";

export const contactService = {
  async submit(payload: ContactFormInput): Promise<{ ok: true; id: string }> {
    const res = await apiClient.post<{ data: { ok: true; id: string } }>(
      "/api/contact",
      payload
    );
    return res.data.data;
  },

  async listMine(): Promise<ContactMessage[]> {
    const res = await apiClient.get<{ data: ContactMessage[] }>("/api/contact/me");
    return res.data.data;
  },
};
