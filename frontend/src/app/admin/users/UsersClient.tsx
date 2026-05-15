"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  Loader2,
  Search,
  ShieldCheck,
  ShieldOff,
  BadgeCheck,
  Trash2,
} from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import { adminService } from "@/lib/api/admin.service";
import { extractApiError } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth.store";
import type { User, UserRole } from "@/types";

const ConfirmDialog = dynamic(() => import("@/components/ui/ConfirmDialog"), {
  ssr: false,
});

export default function UsersClient() {
  const me = useAuthStore((s) => s.user);
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = async (search = "") => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.listUsers({ q: search, limit: 50 });
      setUsers(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(extractApiError(err, "Could not load users"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(q.trim());
  };

  const onDelete = (u: User) => {
    setDeleteError(null);
    setDeleteTarget(u);
  };

  const onConfirmDelete = async () => {
    if (!deleteTarget) return;
    const u = deleteTarget;
    setDeletingId(u.id);
    setDeleteError(null);
    try {
      await adminService.deleteUser(u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      setTotal((t) => Math.max(0, t - 1));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(extractApiError(err, "Could not delete account"));
    } finally {
      setDeletingId(null);
    }
  };

  const toggleRole = async (u: User) => {
    const next: UserRole = u.role === "admin" ? "user" : "admin";
    setUpdatingId(u.id);
    try {
      const updated = await adminService.updateUserRole(u.id, next);
      setUsers((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    } catch (err) {
      setError(extractApiError(err, "Could not update role"));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Users"
        description={`${total} ${total === 1 ? "account" : "accounts"} in the system. Promote travellers to admin to grant them access here.`}
        action={
          <form onSubmit={onSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="search"
                placeholder="Search name, username, email…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-72 rounded-full border border-black/10 bg-white pl-9 pr-4 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark transition"
            >
              Search
            </button>
          </form>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-14 text-muted">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-14 text-center text-sm text-muted">
            No users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-soft text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">User</th>
                  <th className="px-5 py-3 text-left font-semibold">Contact</th>
                  <th className="px-5 py-3 text-left font-semibold">Role</th>
                  <th className="px-5 py-3 text-left font-semibold">Joined</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {users.map((u) => {
                  const isMe = me?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-soft/60">
                      <td className="px-5 py-3">
                        <div className="font-semibold text-ink flex items-center gap-1">
                          {u.name}
                          {u.isEmailVerified && (
                            <BadgeCheck className="h-4 w-4 text-brand" />
                          )}
                        </div>
                        <div className="text-xs text-muted">@{u.username}</div>
                      </td>
                      <td className="px-5 py-3 text-ink">
                        <div>{u.email}</div>
                        <div className="text-xs text-muted">{u.phone}</div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                            u.role === "admin"
                              ? "bg-accent/15 text-accent"
                              : "bg-brand-light text-brand-dark"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-muted text-xs">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleRole(u)}
                            disabled={isMe || updatingId === u.id}
                            title={isMe ? "You can't change your own role" : ""}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                              u.role === "admin"
                                ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                                : "border border-brand/20 bg-brand-light text-brand-dark hover:bg-brand/10"
                            }`}
                          >
                            {updatingId === u.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : u.role === "admin" ? (
                              <ShieldOff className="h-3 w-3" />
                            ) : (
                              <ShieldCheck className="h-3 w-3" />
                            )}
                            {u.role === "admin" ? "Demote" : "Make admin"}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(u)}
                            disabled={isMe || deletingId === u.id}
                            title={isMe ? "You can't delete your own account here" : "Delete account"}
                            className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                          >
                            {deletingId === u.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete account"
        message={
          deleteTarget ? (
            <>
              This will permanently remove{" "}
              <span className="font-semibold text-ink">{deleteTarget.name}</span>{" "}
              (@{deleteTarget.username}) and revoke all their sessions. This
              action cannot be undone.
            </>
          ) : (
            ""
          )
        }
        confirmLabel="Delete account"
        destructive
        loading={!!deletingId}
        error={deleteError}
        requireText={deleteTarget?.username}
        onConfirm={onConfirmDelete}
        onClose={() => {
          if (deletingId) return;
          setDeleteTarget(null);
          setDeleteError(null);
        }}
      />
    </>
  );
}
