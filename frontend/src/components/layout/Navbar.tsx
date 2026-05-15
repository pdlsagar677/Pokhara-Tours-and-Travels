"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, LogOut, UserCircle2, ShieldCheck } from "lucide-react";
import Logo from "./Logo";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/destinations", label: "Destinations" },
  { href: "/hotels", label: "Hotels" },
  { href: "/adventures", label: "Adventures" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    router.push("/");
    router.refresh();
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all",
        scrolled
          ? "bg-white/95 backdrop-blur shadow-sm"
          : "bg-white/80 backdrop-blur"
      )}
    >
      <div className="mx-auto flex h-16 md:h-20 max-w-7xl items-center justify-between px-4 md:px-8">
        <Logo />

        <nav className="hidden lg:flex items-center gap-7">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-brand",
                  active ? "text-brand" : "text-ink/80"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-brand/20 bg-brand-light px-3 py-1.5 text-sm font-medium text-brand-dark hover:bg-brand/10 transition"
              >
                <UserCircle2 className="h-5 w-5" />
                <span className="hidden sm:inline">{user.name.split(" ")[0]}</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-xl border border-black/5 bg-white p-2 shadow-lg">
                  <div className="px-3 py-2 text-xs text-muted border-b border-black/5">
                    Signed in as
                    <div className="text-sm font-semibold text-ink truncate">
                      {user.email}
                    </div>
                    {user.role === "admin" && (
                      <span className="mt-1 inline-block rounded bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-accent">
                        Admin
                      </span>
                    )}
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink hover:bg-soft transition"
                  >
                    <UserCircle2 className="h-4 w-4" />
                    My profile
                  </Link>
                  {user.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink hover:bg-soft transition"
                    >
                      <ShieldCheck className="h-4 w-4 text-accent" />
                      Admin panel
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink hover:bg-soft transition"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark transition"
            >
              Login
            </Link>
          )}

          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-md text-ink hover:bg-soft"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-black/5 bg-white">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-brand-light text-brand-dark"
                      : "text-ink hover:bg-soft"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            {!isAuthenticated && (
              <Link
                href="/login"
                className="mt-2 inline-flex items-center justify-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
