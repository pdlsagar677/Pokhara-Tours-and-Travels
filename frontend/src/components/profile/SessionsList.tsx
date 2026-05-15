"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, Monitor, X } from "lucide-react";
import { authService } from "@/lib/api/auth.service";
import { extractApiError } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth.store";
import type { AuthSessionInfo } from "@/types";

export default function SessionsList() {
  const router = useRouter();
  const [sessions, setSessions] = useState<AuthSessionInfo[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyOthers, setBusyOthers] = useState(false);
  const clearAuth = useAuthStore((s) => s.clear);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items = await authService.listSessions();
        if (!cancelled) setSessions(items);
      } catch (err) {
        if (!cancelled)
          setError(extractApiError(err, "Could not load sessions"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRevoke(s: AuthSessionInfo) {
    const label = s.current ? "Sign out from this device?" : `Sign out ${s.deviceLabel}?`;
    if (!window.confirm(label)) return;
    setBusyId(s.id);
    setError(null);
    try {
      const { current } = await authService.revokeSession(s.id);
      if (current) {
        clearAuth();
        router.push("/login");
        return;
      }
      setSessions((prev) => (prev ? prev.filter((x) => x.id !== s.id) : prev));
    } catch (err) {
      setError(extractApiError(err, "Could not revoke session"));
    } finally {
      setBusyId(null);
    }
  }

  async function handleRevokeOthers() {
    if (
      !window.confirm(
        "Sign out of all other devices? You'll stay signed in here."
      )
    )
      return;
    setBusyOthers(true);
    setError(null);
    try {
      await authService.revokeOtherSessions();
      setSessions((prev) => (prev ? prev.filter((x) => x.current) : prev));
    } catch (err) {
      setError(extractApiError(err, "Could not sign out other devices"));
    } finally {
      setBusyOthers(false);
    }
  }

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
            <Monitor className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-ink">
              Active sessions
            </h2>
            <p className="text-xs text-muted">
              Devices currently signed in to your account.
            </p>
          </div>
        </div>
        {sessions && sessions.length > 1 && (
          <button
            type="button"
            onClick={handleRevokeOthers}
            disabled={busyOthers}
            className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {busyOthers ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <LogOut className="h-3.5 w-3.5" />
            )}
            Sign out other devices
          </button>
        )}
      </header>

      {loading && (
        <div className="mt-8 flex items-center justify-center text-muted">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && sessions && sessions.length === 0 && (
        <p className="mt-6 text-sm text-muted">No active sessions.</p>
      )}

      {!loading && sessions && sessions.length > 0 && (
        <ul className="mt-5 divide-y divide-black/5">
          {sessions.map((s) => (
            <li key={s.id} className="py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{s.deviceLabel}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {s.ipAddress || "Unknown IP"} · last active{" "}
                    {new Date(s.lastUsedAt).toLocaleString()}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    Signed in {new Date(s.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {s.current && (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-[11px] font-semibold text-green-800">
                      This device
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRevoke(s)}
                    disabled={busyId === s.id}
                    className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-3 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    {busyId === s.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                    {s.current ? "Sign out" : "Revoke"}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
