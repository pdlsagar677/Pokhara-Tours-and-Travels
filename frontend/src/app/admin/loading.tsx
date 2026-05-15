import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <div className="h-16 rounded-2xl border border-black/5 bg-white shadow-sm animate-pulse" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl border border-black/5 bg-white shadow-sm animate-pulse"
          />
        ))}
      </div>
      <div className="rounded-2xl border border-black/5 bg-white p-12 shadow-sm">
        <div className="flex items-center justify-center text-muted">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      </div>
    </div>
  );
}
