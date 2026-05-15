"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import { motion } from "framer-motion";
import {
  ArrowDownAZ,
  ImageOff,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { packagesService } from "@/lib/api/packages.service";
import { extractApiError } from "@/lib/api/client";
import { formatNPR } from "@/lib/utils";
import { useDebounce } from "@/lib/hooks/useDebounce";
import Pagination from "@/components/ui/Pagination";
import AISearchBar from "@/components/ai/AISearchBar";
import {
  PACKAGE_CATEGORIES,
  type Package,
  type PackageCategory,
  type PackageType,
  type SemanticSearchResult,
} from "@/types";

const PackageDetailDialog = dynamic(
  () => import("@/components/packages/PackageDetailDialog"),
  { ssr: false }
);

const PAGE_SIZE = 6;

type CategoryFilter = "all" | PackageCategory;
type SortKey = "newest" | "oldest" | "price-asc" | "price-desc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

function applyFilters(
  items: Package[],
  query: string,
  category: CategoryFilter
) {
  const q = query.trim().toLowerCase();
  if (!q && category === "all") return items;
  return items.filter((p) => {
    if (category !== "all" && p.category !== category) return false;
    if (!q) return true;
    return (
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });
}

function applySort(items: Package[], sort: SortKey) {
  const sorted = [...items];
  switch (sort) {
    case "newest":
      sorted.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
      break;
    case "oldest":
      sorted.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
      break;
    case "price-asc":
      sorted.sort((a, b) => a.priceNPR - b.priceNPR);
      break;
    case "price-desc":
      sorted.sort((a, b) => b.priceNPR - a.priceNPR);
      break;
  }
  return sorted;
}

type SectionCopy = {
  offerEyebrow: string;
  offerTitle: string;
  offerSubtitle: string;
  regularEyebrow: string;
  regularTitle: string;
  regularSubtitle: string;
  emptyTitle: string;
  emptyDescription: string;
};

const DEFAULT_COPY: Record<PackageType, SectionCopy> = {
  destination: {
    offerEyebrow: "Special offers",
    offerTitle: "Featured deals — book now",
    offerSubtitle: "Hand-picked promotions on tours and packages.",
    regularEyebrow: "All packages",
    regularTitle: "Tours and packages across Nepal",
    regularSubtitle: "Trekking, cultural visits, wildlife safaris and more.",
    emptyTitle: "No packages published yet",
    emptyDescription: "Once an admin adds tour packages from the dashboard, they'll show up here.",
  },
  hotel: {
    offerEyebrow: "Hotel deals",
    offerTitle: "Featured hotel offers",
    offerSubtitle: "Handpicked stays at promotional rates.",
    regularEyebrow: "All hotels",
    regularTitle: "Stay across Nepal",
    regularSubtitle: "Boutique lodges, lakeside hotels, and mountain retreats.",
    emptyTitle: "No hotels listed yet",
    emptyDescription: "Once an admin adds hotel listings from the dashboard, they'll show up here.",
  },
  adventure: {
    offerEyebrow: "Adventure deals",
    offerTitle: "Featured adventures",
    offerSubtitle: "Promotional rates on adrenaline-packed activities.",
    regularEyebrow: "All adventures",
    regularTitle: "Adventures across Nepal",
    regularSubtitle: "Paragliding, rafting, bungee, ziplining, and more.",
    emptyTitle: "No adventures listed yet",
    emptyDescription: "Once an admin adds adventure activities from the dashboard, they'll show up here.",
  },
};

type Props = {
  initialPackages?: Package[];
  filterType?: PackageType;
  copy?: SectionCopy;
};

export default function DestinationsClient({
  initialPackages,
  filterType,
  copy,
}: Props = {}) {
  const sectionCopy = copy ?? DEFAULT_COPY[filterType ?? "destination"];
  const [items, setItems] = useState<Package[] | null>(
    initialPackages && initialPackages.length > 0 ? initialPackages : null
  );
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<Package | null>(null);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 250);
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [sort, setSort] = useState<SortKey>("newest");

  const [aiSlugs, setAiSlugs] = useState<string[] | null>(null);

  const [offerPage, setOfferPage] = useState(1);
  const [regularPage, setRegularPage] = useState(1);

  useEffect(() => {
    if (initialPackages && initialPackages.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await packagesService.list(filterType);
        if (!cancelled) setItems(list);
      } catch (err) {
        if (!cancelled) setError(extractApiError(err, "Could not load packages"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialPackages, filterType]);

  // Reset paging when filters change
  useEffect(() => {
    setOfferPage(1);
    setRegularPage(1);
  }, [debouncedQuery, category, sort]);

  const filteredSorted = useMemo(() => {
    if (!items) return [];
    if (aiSlugs) {
      const ranked = aiSlugs
        .map((slug) => items.find((p) => p.slug === slug))
        .filter((p): p is Package => Boolean(p));
      return ranked;
    }
    return applySort(applyFilters(items, debouncedQuery, category), sort);
  }, [items, debouncedQuery, category, sort, aiSlugs]);

  const offers = useMemo(
    () => filteredSorted.filter((p) => p.isOffer),
    [filteredSorted]
  );
  const regular = useMemo(
    () => filteredSorted.filter((p) => !p.isOffer),
    [filteredSorted]
  );

  const offerTotalPages = Math.max(1, Math.ceil(offers.length / PAGE_SIZE));
  const regularTotalPages = Math.max(1, Math.ceil(regular.length / PAGE_SIZE));

  const safeOfferPage = Math.min(offerPage, offerTotalPages);
  const safeRegularPage = Math.min(regularPage, regularTotalPages);

  const offerPaged = useMemo(
    () =>
      offers.slice((safeOfferPage - 1) * PAGE_SIZE, safeOfferPage * PAGE_SIZE),
    [offers, safeOfferPage]
  );
  const regularPaged = useMemo(
    () =>
      regular.slice(
        (safeRegularPage - 1) * PAGE_SIZE,
        safeRegularPage * PAGE_SIZE
      ),
    [regular, safeRegularPage]
  );

  const handleOpen = useCallback((p: Package) => setActive(p), []);
  const handleClose = useCallback(() => setActive(null), []);
  const handleAIResults = useCallback((results: SemanticSearchResult[]) => {
    setAiSlugs(results.map((r) => r.slug));
    setOfferPage(1);
    setRegularPage(1);
  }, []);
  const handleAIClear = useCallback(() => setAiSlugs(null), []);
  const handleSearch = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value),
    []
  );
  const handleCategory = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) =>
      setCategory(e.target.value as CategoryFilter),
    []
  );
  const handleSort = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => setSort(e.target.value as SortKey),
    []
  );
  const clearQuery = useCallback(() => setQuery(""), []);

  if (!items && !error) {
    return (
      <div className="flex items-center justify-center py-24 text-muted">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (items && items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-black/10 bg-white p-14 text-center">
        <h2 className="font-display text-xl font-bold text-ink">
          {sectionCopy.emptyTitle}
        </h2>
        <p className="mt-2 text-sm text-muted">{sectionCopy.emptyDescription}</p>
      </div>
    );
  }

  const totalMatched = filteredSorted.length;

  return (
    <>
      <AISearchBar onResults={handleAIResults} onClear={handleAIClear} active={aiSlugs !== null} />
      <FilterBar
        query={query}
        category={category}
        sort={sort}
        totalMatched={totalMatched}
        totalAll={items!.length}
        onSearch={handleSearch}
        onCategory={handleCategory}
        onSort={handleSort}
        onClearQuery={clearQuery}
      />

      {totalMatched === 0 && (
        <div className="rounded-3xl border border-dashed border-black/10 bg-white p-14 text-center">
          <h2 className="font-display text-xl font-bold text-ink">
            No matches
          </h2>
          <p className="mt-2 text-sm text-muted">
            Try a different search term or clear the category filter.
          </p>
        </div>
      )}

      {offers.length > 0 && (
        <section className="mb-14">
          <SectionHeader
            tone="offer"
            eyebrow={sectionCopy.offerEyebrow}
            title={sectionCopy.offerTitle}
            subtitle={sectionCopy.offerSubtitle}
            count={offers.length}
          />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {offerPaged.map((p, idx) => (
              <PackageCard key={p.id} pkg={p} index={idx} onOpen={handleOpen} />
            ))}
          </div>
          <Pagination
            page={safeOfferPage}
            totalPages={offerTotalPages}
            onChange={setOfferPage}
          />
        </section>
      )}

      {regular.length > 0 && (
        <section>
          <SectionHeader
            tone="regular"
            eyebrow={sectionCopy.regularEyebrow}
            title={sectionCopy.regularTitle}
            subtitle={sectionCopy.regularSubtitle}
            count={regular.length}
          />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {regularPaged.map((p, idx) => (
              <PackageCard key={p.id} pkg={p} index={idx} onOpen={handleOpen} />
            ))}
          </div>
          <Pagination
            page={safeRegularPage}
            totalPages={regularTotalPages}
            onChange={setRegularPage}
          />
        </section>
      )}

      <PackageDetailDialog
        pkg={active}
        onClose={handleClose}
        onSelectPackage={setActive}
      />
    </>
  );
}

type FilterBarProps = {
  query: string;
  category: CategoryFilter;
  sort: SortKey;
  totalMatched: number;
  totalAll: number;
  onSearch: (e: ChangeEvent<HTMLInputElement>) => void;
  onCategory: (e: ChangeEvent<HTMLSelectElement>) => void;
  onSort: (e: ChangeEvent<HTMLSelectElement>) => void;
  onClearQuery: () => void;
};

const FilterBar = memo(function FilterBar({
  query,
  category,
  sort,
  totalMatched,
  totalAll,
  onSearch,
  onCategory,
  onSort,
  onClearQuery,
}: FilterBarProps) {
  return (
    <div className="mb-10 rounded-2xl border border-black/5 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="search"
            placeholder="Search by name, description, or category…"
            value={query}
            onChange={onSearch}
            className="w-full rounded-full border border-black/10 bg-white pl-9 pr-9 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={onClearQuery}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded-full text-muted hover:bg-soft hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
          <select
            value={category}
            onChange={onCategory}
            aria-label="Filter by category"
            className="rounded-full border border-black/10 bg-white px-3 py-2.5 text-sm capitalize focus:border-brand focus:outline-none"
          >
            <option value="all">All categories</option>
            {PACKAGE_CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">
                {c}
              </option>
            ))}
          </select>

          <div className="relative">
            <ArrowDownAZ className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <select
              value={sort}
              onChange={onSort}
              aria-label="Sort"
              className="w-full rounded-full border border-black/10 bg-white pl-9 pr-3 py-2.5 text-sm focus:border-brand focus:outline-none"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted">
        Showing <span className="font-semibold text-ink">{totalMatched}</span> of {totalAll} packages
        {category !== "all" && (
          <>
            {" "}
            in <span className="font-semibold capitalize text-ink">{category}</span>
          </>
        )}
        {query && (
          <>
            {" "}
            matching <span className="font-semibold text-ink">&ldquo;{query}&rdquo;</span>
          </>
        )}
        .
      </p>
    </div>
  );
});

type SectionHeaderProps = {
  tone: "offer" | "regular";
  eyebrow: string;
  title: string;
  subtitle: string;
  count: number;
};

const SectionHeader = memo(function SectionHeader({
  tone,
  eyebrow,
  title,
  subtitle,
  count,
}: SectionHeaderProps) {
  const eyebrowStyles =
    tone === "offer"
      ? "bg-accent/15 text-accent"
      : "bg-brand-light text-brand";
  const Icon = tone === "offer" ? Sparkles : MapPin;
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest ${eyebrowStyles}`}
        >
          <Icon className="h-3.5 w-3.5" />
          {eyebrow}
        </span>
        <h2 className="mt-3 font-display text-2xl font-extrabold text-ink md:text-3xl">
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
      </div>
      <span className="text-xs text-muted">
        {count} {count === 1 ? "result" : "results"}
      </span>
    </header>
  );
});

type CardProps = {
  pkg: Package;
  index: number;
  onOpen: (pkg: Package) => void;
};

const PackageCard = memo(function PackageCard({ pkg, index, onOpen }: CardProps) {
  const cover = pkg.gallery[0];
  const handleClick = () => onOpen(pkg);
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: Math.min(index, 8) * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -6 }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition-shadow duration-300 hover:shadow-[0_20px_45px_-20px_rgba(2,132,199,0.35),inset_0_0_0_1px_rgba(2,132,199,0.18),inset_0_-50px_70px_-40px_rgba(2,132,199,0.22)]"
    >
      <button
        type="button"
        onClick={handleClick}
        aria-label={`View details for ${pkg.title}`}
        className="relative aspect-[16/10] bg-soft text-left"
      >
        {cover ? (
          <Image
            src={cover}
            alt={pkg.title}
            fill
            sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
            unoptimized
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-light to-soft">
            <ImageOff className="h-10 w-10 text-brand/50" />
          </div>
        )}
        <span className="absolute left-4 top-4 inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-bold text-white shadow-sm">
          {formatNPR(pkg.priceNPR)}
        </span>
        {pkg.isOffer && (
          <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-accent shadow-sm backdrop-blur">
            <Sparkles className="h-3 w-3" />
            Offer
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-brand-light px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-dark">
            {pkg.category}
          </span>
        </div>
        <h3 className="mt-2 font-display text-lg font-extrabold text-ink line-clamp-2">
          {pkg.title}
        </h3>
        <p className="mt-2 text-sm text-muted line-clamp-3 flex-1">
          {pkg.description}
        </p>
        <button
          type="button"
          onClick={handleClick}
          className="mt-4 inline-flex w-fit items-center gap-1 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark group-hover:shadow-[0_8px_20px_-8px_rgba(2,132,199,0.6)]"
        >
          Read more
        </button>
      </div>

      <div className="flex items-center justify-between border-t border-black/5 px-5 py-3 text-xs text-muted">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          Nepal
        </span>
        <span className="font-semibold text-ink">
          {formatNPR(pkg.priceNPR)} / person
        </span>
      </div>
    </motion.article>
  );
});
