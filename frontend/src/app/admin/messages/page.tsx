import type { Metadata } from "next";
import MessagesClient from "./MessagesClient";

export const metadata: Metadata = {
  title: "Messages | Admin",
  description: "Read, reply to, and manage messages from the contact form.",
};

export default function AdminMessagesPage() {
  return <MessagesClient />;
}
