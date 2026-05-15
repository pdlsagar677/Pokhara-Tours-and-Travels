import type { Metadata } from "next";
import UsersClient from "./UsersClient";

export const metadata: Metadata = {
  title: "Users | Admin",
  description: "Manage user accounts and roles.",
};

export default function AdminUsersPage() {
  return <UsersClient />;
}
