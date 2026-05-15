"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Package,
  CalendarCheck,
  MessageSquare,
  Settings,
  ShieldCheck,
  ArrowLeft,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/packages", label: "Packages", icon: Package },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    router.push("/");
    router.refresh();
  };

  const Inner = (
    <div className="flex h-full flex-col bg-ink text-white/85">
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs uppercase tracking-widest text-white/60">Admin</p>
            <p className="font-display text-sm font-bold text-white truncate">
              Pokhara Tours
            </p>
          </div>
        </div>
        {user && (
          <div className="mt-4 rounded-lg bg-white/5 p-3 text-xs">
            <p className="font-semibold text-white">{user.name}</p>
            <p className="truncate text-white/60">{user.email}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-brand text-white shadow-sm"
                  : "text-white/80 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3 space-y-1">
        <Link
          href="/profile"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          My profile
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white transition"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        aria-label="Toggle admin menu"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 left-5 z-40 lg:hidden inline-flex h-12 w-12 items-center justify-center rounded-full bg-ink text-white shadow-lg"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85%]">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md text-white/80 hover:text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
            {Inner}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col fixed top-0 left-0 h-full w-64 z-30">
        {Inner}
      </aside>
    </>
  );
}
