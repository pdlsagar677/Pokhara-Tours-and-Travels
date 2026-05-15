"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import type { UserRole } from "@/types";

type ProtectedRouteProps = {
  children: React.ReactNode;
  /** If set, the user must have this role; non-matches are redirected to /profile. */
  requireRole?: UserRole;
};

export default function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isHydrating = useAuthStore((s) => s.isHydrating);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isHydrating) return;
    if (!isAuthenticated) {
      const next = encodeURIComponent(pathname);
      router.replace(`/login?next=${next}`);
      return;
    }
    if (requireRole && user?.role !== requireRole) {
      router.replace("/profile");
    }
  }, [isHydrating, isAuthenticated, user, requireRole, router, pathname]);

  if (isHydrating || !isAuthenticated || (requireRole && user?.role !== requireRole)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
