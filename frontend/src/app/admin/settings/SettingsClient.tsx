"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Construction, Loader2, Save } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import { settingsService } from "@/lib/api/settings.service";
import { extractApiError } from "@/lib/api/client";
import type { SiteSettings } from "@/types";

const MAX_MESSAGE = 500;

export default function SettingsClient() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await settingsService.getAdmin();
        if (cancelled) return;
        setSettings(data);
        setMaintenanceMode(data.maintenanceMode);
        setMaintenanceMessage(data.maintenanceMessage || "");
      } catch (err) {
        if (!cancelled) setError(extractApiError(err, "Could not load settings"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const dirty =
    !!settings &&
    (settings.maintenanceMode !== maintenanceMode ||
      (settings.maintenanceMessage || "") !== maintenanceMessage);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await settingsService.update({
        maintenanceMode,
        maintenanceMessage,
      });
      setSettings(updated);
      setMaintenanceMode(updated.maintenanceMode);
      setMaintenanceMessage(updated.maintenanceMessage || "");
      setSavedAt(Date.now());
    } catch (err) {
      setError(extractApiError(err, "Could not save settings"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Settings"
        description="Site-wide controls. Maintenance mode blocks the public site for everyone except admins."
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-black/5 bg-white p-14 text-muted shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <form onSubmit={onSave} className="space-y-6">
          {/* MAINTENANCE CARD */}
          <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-start gap-4">
              <span
                className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  maintenanceMode
                    ? "bg-accent/15 text-accent"
                    : "bg-brand-light text-brand"
                }`}
              >
                <Construction className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <h2 className="font-display text-lg font-bold text-ink">
                  Maintenance mode
                </h2>
                <p className="mt-1 text-sm text-muted">
                  When enabled, every public page is replaced with a
                  maintenance notice. The admin panel and the login page stay
                  open so you can keep working and switch it back off.
                </p>

                <div className="mt-5 flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={maintenanceMode}
                    onClick={() => setMaintenanceMode((v) => !v)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 ${
                      maintenanceMode ? "bg-accent" : "bg-black/15"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                        maintenanceMode ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {maintenanceMode ? "Maintenance is ON" : "Maintenance is OFF"}
                    </p>
                    <p className="text-xs text-muted">
                      {maintenanceMode
                        ? "Public site is hidden. Admins still have full access."
                        : "Site is fully accessible to everyone."}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <label
                    htmlFor="maintenanceMessage"
                    className="text-sm font-medium text-ink"
                  >
                    Custom message{" "}
                    <span className="text-muted">(optional)</span>
                  </label>
                  <textarea
                    id="maintenanceMessage"
                    rows={3}
                    maxLength={MAX_MESSAGE}
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    placeholder="Back online by 7 PM Nepal time. Thanks for your patience!"
                    className="mt-1 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm focus:border-brand focus:outline-none"
                  />
                  <p className="mt-1 text-right text-[11px] text-muted">
                    {maintenanceMessage.length}/{MAX_MESSAGE}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* SAVE BAR */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white px-5 py-4 shadow-sm">
            <div className="text-xs text-muted">
              {savedAt && !dirty ? (
                <span className="inline-flex items-center gap-1.5 text-green-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Saved
                </span>
              ) : dirty ? (
                "You have unsaved changes."
              ) : settings ? (
                `Last updated ${new Date(settings.updatedAt).toLocaleString()}`
              ) : null}
            </div>
            <button
              type="submit"
              disabled={!dirty || saving}
              className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save changes
            </button>
          </div>
        </form>
      )}
    </>
  );
}
