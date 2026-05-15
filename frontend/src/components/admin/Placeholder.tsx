import { Sparkles } from "lucide-react";

export default function Placeholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-black/10 bg-white p-10 text-center">
      <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-light text-brand">
        <Sparkles className="h-6 w-6" />
      </span>
      <h3 className="mt-4 font-display text-lg font-bold text-ink">{title}</h3>
      <p className="mt-1 max-w-md mx-auto text-sm text-muted">{description}</p>
      <p className="mt-4 text-xs text-muted">UI ready — backend logic coming in a follow-up step.</p>
    </div>
  );
}
