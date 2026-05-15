import type { Metadata } from "next";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata: Metadata = {
  title: "Admin — Pokhara Tours and Travel",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireRole="admin">
      <div className="bg-soft min-h-[calc(100vh-5rem)]">
        <AdminSidebar />
        <main className="lg:ml-64 p-4 md:p-8">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
