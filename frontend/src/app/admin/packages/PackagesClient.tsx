"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import {
  BedDouble,
  ImageOff,
  Loader2,
  MapPin,
  MountainSnow,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import { adminService } from "@/lib/api/admin.service";
import { extractApiError } from "@/lib/api/client";
import { cn, formatNPR } from "@/lib/utils";
import {
  PACKAGE_CATEGORIES,
  type Package,
  type PackageCategory,
  type PackageType,
} from "@/types";

const PackageFormDialog = dynamic(
  () => import("@/components/admin/PackageFormDialog"),
  { ssr: false }
);

const ConfirmDialog = dynamic(() => import("@/components/ui/ConfirmDialog"), {
  ssr: false,
});

const TYPE_TABS: { value: PackageType; label: string; icon: typeof MapPin }[] = [
  { value: "destination", label: "Destinations", icon: MapPin },
  { value: "hotel", label: "Hotels", icon: BedDouble },
  { value: "adventure", label: "Adventures", icon: MountainSnow },
];

export default function PackagesClient() {
  const [activeType, setActiveType] = useState<PackageType>("destination");
  const [items, setItems] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Package | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Package | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [savingCategoryId, setSavingCategoryId] = useState<string | null>(null);

  const load = useCallback(async (type: PackageType) => {
    setLoading(true);
    setError(null);
    try {
      const list = await adminService.listPackages(type);
      setItems(list);
    } catch (err) {
      setError(extractApiError(err, "Could not load packages"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(activeType);
  }, [activeType, load]);

  const onAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const onEdit = (pkg: Package) => {
    setEditing(pkg);
    setDialogOpen(true);
  };

  const onSaved = (pkg: Package) => {
    setItems((prev) => {
      if (pkg.type !== activeType) {
        return prev.filter((p) => p.id !== pkg.id);
      }
      const i = prev.findIndex((p) => p.id === pkg.id);
      if (i === -1) return [pkg, ...prev];
      const copy = [...prev];
      copy[i] = pkg;
      return copy;
    });
  };

  const onCategoryChange = async (pkg: Package, newCategory: PackageCategory) => {
    if (newCategory === pkg.category) return;
    setSavingCategoryId(pkg.id);
    setError(null);
    setItems((prev) =>
      prev.map((x) => (x.id === pkg.id ? { ...x, category: newCategory } : x))
    );
    try {
      const saved = await adminService.updatePackage(pkg.id, {
        title: pkg.title,
        description: pkg.description,
        priceNPR: pkg.priceNPR,
        gallery: pkg.gallery,
        isOffer: pkg.isOffer,
        category: newCategory,
        type: pkg.type,
      });
      setItems((prev) => prev.map((x) => (x.id === pkg.id ? saved : x)));
    } catch (err) {
      setItems((prev) => prev.map((x) => (x.id === pkg.id ? pkg : x)));
      setError(extractApiError(err, "Could not update category"));
    } finally {
      setSavingCategoryId(null);
    }
  };

  const onDelete = (pkg: Package) => {
    setConfirmError(null);
    setConfirmTarget(pkg);
  };

  const onConfirmDelete = async () => {
    if (!confirmTarget) return;
    const pkg = confirmTarget;
    setDeletingId(pkg.id);
    setConfirmError(null);
    try {
      await adminService.deletePackage(pkg.id);
      setItems((prev) => prev.filter((p) => p.id !== pkg.id));
      setConfirmTarget(null);
    } catch (err) {
      setConfirmError(extractApiError(err, "Could not delete package"));
    } finally {
      setDeletingId(null);
    }
  };

  const activeLabel = TYPE_TABS.find((t) => t.value === activeType)!.label.toLowerCase();

  return (
    <>
      <PageHeader
        title="Packages"
        description={`${items.length} ${activeLabel.replace(/s$/, "")}${items.length === 1 ? "" : "s"} in this view.`}
        action={
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark transition"
          >
            <Plus className="h-4 w-4" />
            Add {TYPE_TABS.find((t) => t.value === activeType)!.label.replace(/s$/, "").toLowerCase()}
          </button>
        }
      />

      <div
        role="tablist"
        aria-label="Package type"
        className="mb-5 inline-flex items-center gap-1 rounded-full border border-black/10 bg-white p-1 shadow-sm"
      >
        {TYPE_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = tab.value === activeType;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveType(tab.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition",
                active
                  ? "bg-brand text-white shadow-sm"
                  : "text-ink hover:bg-soft"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

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
        ) : items.length === 0 ? (
          <div className="p-14 text-center">
            <p className="text-sm text-muted">No packages yet.</p>
            <button
              type="button"
              onClick={onAdd}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark transition"
            >
              <Plus className="h-4 w-4" />
              Add your first package
            </button>
          </div>
        ) : (
          <>
            {/* Mobile card list */}
            <ul className="divide-y divide-black/5 md:hidden">
              {items.map((p) => {
                const cover = p.gallery[0];
                return (
                  <li key={p.id} className="p-4">
                    <div className="flex gap-3">
                      <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-soft">
                        {cover ? (
                          <Image
                            src={cover}
                            alt={p.title}
                            fill
                            sizes="80px"
                            unoptimized
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted">
                            <ImageOff className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink line-clamp-2 text-sm">
                          {p.title}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {p.isOffer && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                              <Sparkles className="h-3 w-3" />
                              Offer
                            </span>
                          )}
                          <CategoryDropdown
                            value={p.category}
                            saving={savingCategoryId === p.id}
                            onChange={(v) => onCategoryChange(p, v)}
                          />
                          <span className="text-[11px] text-muted">
                            {p.gallery.length}/5 images
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs font-semibold text-ink">
                          {formatNPR(p.priceNPR)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(p)}
                        className="inline-flex items-center gap-1 rounded-full border border-brand/30 px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand-light transition"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(p)}
                        disabled={deletingId === p.id}
                        className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition disabled:opacity-60"
                      >
                        {deletingId === p.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                        Delete
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-soft text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">Cover</th>
                  <th className="px-5 py-3 text-left font-semibold">Package</th>
                  <th className="px-5 py-3 text-left font-semibold">Price</th>
                  <th className="px-5 py-3 text-left font-semibold">Images</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {items.map((p) => {
                  const cover = p.gallery[0];
                  return (
                    <tr key={p.id} className="hover:bg-soft/60">
                      <td className="px-5 py-3">
                        <div className="relative h-14 w-20 overflow-hidden rounded-lg bg-soft">
                          {cover ? (
                            <Image
                              src={cover}
                              alt={p.title}
                              fill
                              sizes="80px"
                              unoptimized
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted">
                              <ImageOff className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-ink line-clamp-1">{p.title}</span>
                          {p.isOffer && (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                              <Sparkles className="h-3 w-3" />
                              Offer
                            </span>
                          )}
                          <CategoryDropdown
                            value={p.category}
                            saving={savingCategoryId === p.id}
                            onChange={(v) => onCategoryChange(p, v)}
                          />
                        </div>
                        <div className="text-xs text-muted line-clamp-1">{p.description}</div>
                      </td>
                      <td className="px-5 py-3 text-ink font-semibold">
                        {formatNPR(p.priceNPR)}
                      </td>
                      <td className="px-5 py-3 text-muted text-xs">
                        {p.gallery.length}/5
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onEdit(p)}
                            className="inline-flex items-center gap-1 rounded-full border border-brand/30 px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand-light transition"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(p)}
                            disabled={deletingId === p.id}
                            className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition disabled:opacity-60"
                          >
                            {deletingId === p.id ? (
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
          </>
        )}
      </div>

      <PackageFormDialog
        open={dialogOpen}
        initial={editing}
        defaultType={activeType}
        onClose={() => setDialogOpen(false)}
        onSaved={onSaved}
      />

      <ConfirmDialog
        open={!!confirmTarget}
        title="Delete package"
        message={
          confirmTarget ? (
            <>
              This will permanently remove{" "}
              <span className="font-semibold text-ink">
                &ldquo;{confirmTarget.title}&rdquo;
              </span>
              . This action cannot be undone.
            </>
          ) : (
            ""
          )
        }
        confirmLabel="Delete package"
        destructive
        loading={!!deletingId}
        error={confirmError}
        onConfirm={onConfirmDelete}
        onClose={() => {
          if (deletingId) return;
          setConfirmTarget(null);
          setConfirmError(null);
        }}
      />
    </>
  );
}

function CategoryDropdown({
  value,
  saving,
  onChange,
}: {
  value: PackageCategory;
  saving: boolean;
  onChange: (v: PackageCategory) => void;
}) {
  return (
    <span className="relative inline-flex items-center">
      <select
        value={value}
        disabled={saving}
        onChange={(e) => onChange(e.target.value as PackageCategory)}
        aria-label="Change category"
        className={cn(
          "appearance-none rounded-full bg-brand-light pl-2 pr-6 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-dark capitalize cursor-pointer hover:bg-brand/15 transition focus:outline-none focus:ring-2 focus:ring-brand/40",
          saving && "opacity-60 cursor-wait"
        )}
      >
        {PACKAGE_CATEGORIES.map((c) => (
          <option key={c} value={c} className="capitalize">
            {c}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-1.5 text-brand-dark">
        {saving ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
            <path d="M2 4l3 3 3-3z" />
          </svg>
        )}
      </span>
    </span>
  );
}
