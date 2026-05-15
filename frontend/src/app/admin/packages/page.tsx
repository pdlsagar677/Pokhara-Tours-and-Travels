import type { Metadata } from "next";
import PackagesClient from "./PackagesClient";

export const metadata: Metadata = {
  title: "Packages | Admin",
  description: "Create, edit, and manage tour packages.",
};

export default function AdminPackagesPage() {
  return <PackagesClient />;
}
