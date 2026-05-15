import type { Metadata } from "next";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard | Admin",
  description: "Live counts and recent activity for Pokhara Tours and Travel.",
};

export default function AdminDashboardPage() {
  return <DashboardClient />;
}
