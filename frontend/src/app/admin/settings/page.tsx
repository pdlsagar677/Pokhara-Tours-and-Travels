import type { Metadata } from "next";
import SettingsClient from "./SettingsClient";

export const metadata: Metadata = {
  title: "Settings | Admin",
  description: "Maintenance mode and other site-wide settings.",
};

export default function AdminSettingsPage() {
  return <SettingsClient />;
}
