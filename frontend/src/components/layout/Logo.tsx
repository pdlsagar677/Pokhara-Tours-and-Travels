import Link from "next/link";
import { Mountain } from "lucide-react";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  variant?: "light" | "dark";
};

export default function Logo({ className, variant = "dark" }: LogoProps) {
  const colorClass = variant === "light" ? "text-white" : "text-brand";
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2 group", className)}
      aria-label="Pokhara Tours and Travel — home"
    >
      <span
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white shadow-sm transition group-hover:scale-105",
          variant === "light" && "bg-white text-brand"
        )}
      >
        <Mountain className="h-5 w-5" />
      </span>
      <span
        className={cn(
          "font-display text-xl md:text-2xl font-extrabold tracking-tight leading-none",
          colorClass
        )}
      >
        Pokhara <span className="text-accent">Tours</span>{" "}
        <span className={variant === "light" ? "text-white/90" : "text-ink"}>
          and Travel
        </span>
      </span>
    </Link>
  );
}
