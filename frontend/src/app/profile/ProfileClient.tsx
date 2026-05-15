"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  KeyRound,
  MailOpen,
  Menu,
  Monitor,
  PenSquare,
  ShieldCheck,
  Trash2,
  UserCircle2,
  X,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";
import EditProfileForm from "@/components/profile/EditProfileForm";
import ChangePasswordForm from "@/components/profile/ChangePasswordForm";
import Enable2FAForm from "@/components/profile/Enable2FAForm";
import Disable2FAForm from "@/components/profile/Disable2FAForm";
import SessionsList from "@/components/profile/SessionsList";
import DeleteAccountForm from "@/components/profile/DeleteAccountForm";
import MyBookings from "@/components/profile/MyBookings";
import MyMessages from "@/components/profile/MyMessages";

type Section =
  | "bookings"
  | "messages"
  | "edit-profile"
  | "change-password"
  | "two-factor"
  | "devices"
  | "delete-account";

type NavItem = {
  id: Section;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hideForAdmin?: boolean;
  destructive?: boolean;
};

const ACTIVITY_NAV: NavItem[] = [
  { id: "bookings", label: "My Bookings", icon: CalendarDays, hideForAdmin: true },
  { id: "messages", label: "My Messages", icon: MailOpen, hideForAdmin: true },
];

const SETTINGS_NAV: NavItem[] = [
  { id: "edit-profile", label: "Edit Profile", icon: PenSquare },
  { id: "change-password", label: "Change Password", icon: KeyRound },
  { id: "two-factor", label: "Two-Factor Auth", icon: ShieldCheck },
  { id: "devices", label: "Devices & Sessions", icon: Monitor },
  { id: "delete-account", label: "Delete Account", icon: Trash2, destructive: true },
];

const SECTION_TITLES: Record<Section, string> = {
  bookings: "My Bookings",
  messages: "My Messages",
  "edit-profile": "Edit Profile",
  "change-password": "Change Password",
  "two-factor": "Two-Factor Authentication",
  devices: "Devices & Sessions",
  "delete-account": "Delete Account",
};

export default function ProfileClient() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";

  const [section, setSection] = useState<Section>(
    isAdmin ? "edit-profile" : "bookings"
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (!user) return null;

  const activityItems = ACTIVITY_NAV.filter((i) => !(isAdmin && i.hideForAdmin));

  const handleNav = (id: Section) => {
    setSection(id);
    setDrawerOpen(false);
  };

  const SidebarContent = (
    <div className="flex h-full flex-col gap-6">
      <div className="rounded-2xl bg-gradient-to-br from-brand to-brand-dark p-5 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur">
            <UserCircle2 className="h-7 w-7" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{user.name}</p>
            <p className="truncate text-xs text-white/80">@{user.username}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {user.isEmailVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold backdrop-blur">
              <BadgeCheck className="h-3 w-3" />
              Verified
            </span>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider hover:brightness-110"
            >
              <ShieldCheck className="h-3 w-3" />
              Admin
            </Link>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-6">
        {activityItems.length > 0 && (
          <NavGroup
            label="Activity"
            items={activityItems}
            activeId={section}
            onSelect={handleNav}
          />
        )}
        <NavGroup
          label="Settings"
          items={SETTINGS_NAV}
          activeId={section}
          onSelect={handleNav}
        />
      </nav>
    </div>
  );

  return (
    <div className="bg-soft min-h-[calc(100vh-5rem)]">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-black/5 bg-white px-3 py-2.5 shadow-sm md:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open profile menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-soft"
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="truncate font-display text-base font-bold text-ink">
            {SECTION_TITLES[section]}
          </p>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-light text-brand">
            <UserCircle2 className="h-5 w-5" />
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-[280px_1fr]">
          <div className="hidden md:block">
            <div className="sticky top-24">{SidebarContent}</div>
          </div>

          {drawerOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              <div
                className="absolute inset-0 bg-black/60"
                onClick={() => setDrawerOpen(false)}
                aria-hidden
              />
              <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col overflow-y-auto bg-soft p-4 shadow-2xl">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-display text-sm font-bold text-ink">
                    Account
                  </p>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    aria-label="Close menu"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-white hover:text-ink"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {SidebarContent}
              </div>
            </div>
          )}

          <main className="min-w-0">
            {section === "bookings" && <MyBookings />}
            {section === "messages" && <MyMessages />}
            {section === "edit-profile" && <EditProfileForm />}
            {section === "change-password" && <ChangePasswordForm />}
            {section === "two-factor" && (
              <div className="space-y-6">
                <Enable2FAForm />
                <Disable2FAForm />
              </div>
            )}
            {section === "devices" && <SessionsList />}
            {section === "delete-account" && <DeleteAccountForm />}
          </main>
        </div>
      </div>
    </div>
  );
}

function NavGroup({
  label,
  items,
  activeId,
  onSelect,
}: {
  label: string;
  items: NavItem[];
  activeId: Section;
  onSelect: (id: Section) => void;
}) {
  return (
    <div>
      <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted">
        {label}
      </p>
      <ul className="mt-2 space-y-1">
        {items.map((it) => (
          <NavButton
            key={it.id}
            item={it}
            active={activeId === it.id}
            onClick={() => onSelect(it.id)}
          />
        ))}
      </ul>
    </div>
  );
}

function NavButton({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  const destructive = !!item.destructive;
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition",
          active && destructive && "bg-red-600 text-white shadow-sm",
          active && !destructive && "bg-brand text-white shadow-sm",
          !active && destructive && "text-red-700 hover:bg-red-50",
          !active && !destructive && "text-ink hover:bg-white hover:shadow-sm"
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4 shrink-0",
            active && "text-white",
            !active && destructive && "text-red-600",
            !active && !destructive && "text-muted group-hover:text-brand"
          )}
        />
        <span className="flex-1 truncate">{item.label}</span>
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition",
            active
              ? "text-white/80"
              : "text-transparent group-hover:text-muted"
          )}
        />
      </button>
    </li>
  );
}
