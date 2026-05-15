"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  Eye,
  EyeOff,
  Loader2,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { extractApiError } from "@/lib/api/client";

const ConfirmDialog = dynamic(() => import("@/components/ui/ConfirmDialog"), {
  ssr: false,
});

export default function DeleteAccountForm() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (!user) return null;

  const isAdmin = user.role === "admin";

  if (isAdmin) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <header className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <ShieldAlert className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-ink">
              Delete account
            </h2>
            <p className="text-xs text-amber-900/80">
              Administrators cannot delete their own account.
            </p>
          </div>
        </header>
        <p className="mt-4 text-sm text-amber-900/90">
          For safety, admin accounts can only be removed by another administrator
          from the Users panel. Please ask a co-admin to demote or remove this
          account if you no longer need it.
        </p>
      </section>
    );
  }

  const onRequestDelete = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!password) {
      setFormError("Enter your password to continue.");
      return;
    }
    setConfirmError(null);
    setConfirmOpen(true);
  };

  const onConfirmDelete = async () => {
    setDeleting(true);
    setConfirmError(null);
    try {
      await deleteAccount({ password });
      router.replace("/");
    } catch (err) {
      setConfirmError(extractApiError(err, "Could not delete account"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
        <header className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-700">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-ink">
              Delete account
            </h2>
            <p className="text-xs text-muted">
              Permanently remove your account and all of your bookings.
            </p>
          </div>
        </header>

        <div className="mt-5 rounded-xl border border-red-100 bg-red-50/60 p-4 text-sm text-red-900">
          <p className="font-semibold">This action cannot be undone.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-red-900/90">
            <li>All of your bookings will be permanently deleted.</li>
            <li>Your profile, sessions, and login will be removed.</li>
            <li>You will be signed out immediately.</li>
          </ul>
        </div>

        <form onSubmit={onRequestDelete} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="delete-password"
              className="block text-sm font-medium text-ink"
            >
              Confirm your password
            </label>
            <div className="relative mt-1">
              <input
                id="delete-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (formError) setFormError(null);
                }}
                disabled={deleting}
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 pr-11 text-sm text-ink shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 disabled:bg-soft"
                placeholder="Enter your current password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-2 inline-flex h-full w-9 items-center justify-center text-muted hover:text-ink"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {formError && (
              <p className="mt-1.5 text-xs text-red-700">{formError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={deleting}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete my account
          </button>
        </form>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Permanently delete your account?"
        message={
          <>
            This will permanently remove{" "}
            <span className="font-semibold text-ink">@{user.username}</span> and
            every booking you&apos;ve made. You won&apos;t be able to recover
            this account.
          </>
        }
        confirmLabel="Yes, delete forever"
        destructive
        loading={deleting}
        error={confirmError}
        requireText={user.username}
        onConfirm={onConfirmDelete}
        onClose={() => {
          if (deleting) return;
          setConfirmOpen(false);
          setConfirmError(null);
        }}
      />
    </>
  );
}
