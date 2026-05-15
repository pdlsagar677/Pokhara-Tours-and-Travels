import type { Metadata } from "next";
import BookingsClient from "./BookingsClient";

export const metadata: Metadata = {
  title: "Bookings | Admin",
  description: "Manage trip bookings, payment status, and confirmations.",
};

export default function AdminBookingsPage() {
  return <BookingsClient />;
}
