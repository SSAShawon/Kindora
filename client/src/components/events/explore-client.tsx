"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { api } from "@/lib/api";
import { CATEGORY_FILTERS } from "@/lib/constants";
import type { EventListResponse } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { useApi } from "@/hooks/use-api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EventCard, EventCardSkeleton } from "@/components/events/event-card";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { CATEGORY_ICONS } from "@/components/shared/category-badge";

const PAGE_SIZE = 9;

export function ExploreClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "All Events");
  const [sort, setSort] = useState<"soonest" | "newest" | "popular">((searchParams.get("sort") as "soonest") ?? "soonest");
  const [status, setStatus] = useState<"upcoming" | "past">((searchParams.get("status") as "upcoming") ?? "upcoming");
  const [page, setPage] = useState(1);
  const [accumulated, setAccumulated] = useState<EventListResponse | null>(null);

  const debouncedSearch = useDebounce(search, 350);

  // Keep the URL shareable without reloads.
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (category !== "All Events") params.set("category", category);
    if (sort !== "soonest") params.set("sort", sort);
    if (status !== "upcoming") params.set("status", status);
    const qs = params.toString();
    router.replace(qs ? `/events?${qs}` : "/events", { scroll: false });
  }, [debouncedSearch, category, sort, status, router]);

  // Reset pagination whenever the query changes.
  useEffect(() => {
    setPage(1);
    setAccumulated(null);
  }, [debouncedSearch, category, sort, status]);

  const queryKey = useMemo(
    () => JSON.stringify({ search: debouncedSearch, category, sort, status, page }),
    [debouncedSearch, category, sort, status, page],
  );

  const { data, isLoading, error, refetch } = useApi<EventListResponse>(
    (signal) =>
      api.events.list(
        { search: debouncedSearch || undefined, category, sort, status, page, limit: PAGE_SIZE },
        signal,
      ),
    [queryKey],
  );

  // Accumulate pages for "Load more".
  useEffect(() => {
    if (!data) return;
    setAccumulated((previous) => {
      if (!previous || data.page === 1) return data;
      if (previous.page >= data.page) return previous;
      const seen = new Set(previous.events.map((e) => e.id));
      return { ...data, events: [...previous.events, ...data.events.filter((e) => !seen.has(e.id))] };
    });
  }, [data]);

  const events = accumulated?.events ?? [];
  const total = data?.total ?? 0;
  const hasMore = (accumulated?.page ?? 1) < (data?.totalPages ?? 1);
  const hasFilters = Boolean(debouncedSearch) || category !== "All Events" || sort !== "soonest" || status !== "upcoming";

  const clearFilters = useCallback(() => {
    setSearch("");
    setCategory("All Events");
    setSort("soonest");
    setStatus("upcoming");
  }, []);

  const showSkeletons = isLoading && events.length === 0;

  return (
    <div className="container py-12 lg:py-16">
      {/* Header */}
      <div className="max-w-2xl">
        <p className="eyebrow">
          <span className="h-px w-6 bg-primary/60" aria-hidden />
          Explore Events
        </p>
        <h1 className="section-title mt-3">Find where you belong</h1>
        <p className="section-sub">
          Search by title, cause, place, or organizer — then filter by category. Every event
          here is a real opportunity to show up for your community.
        </p>
      </div>

      {/* Search + sort */}
      <div className="mt-10 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search events, places, organizers…"
            aria-label="Search events"
            className="h-12 rounded-full pl-11 pr-11"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-full border border-input bg-card p-1">
            {(["upcoming", "past"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatus(value)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-colors",
                  status === value ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {value}
              </button>
            ))}
          </div>
          <Select value={sort} onValueChange={(value) => setSort(value as typeof sort)}>
            <SelectTrigger className="h-11 w-[160px] rounded-full" aria-label="Sort events">
              <SlidersHorizontal className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="soonest">Soonest first</SelectItem>
              <SelectItem value="newest">Newest added</SelectItem>
              <SelectItem value="popular">Most joined</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Category pills */}
      <div className="scrollbar-thin mt-5 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Filter by category">
        {CATEGORY_FILTERS.map((value) => {
          const Icon = value === "All Events" ? undefined : CATEGORY_ICONS[value];
          const active = category === value;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setCategory(value)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-all",
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-soft"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {value}
            </button>
          );
        })}
      </div>

      {/* Result meta */}
      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {isLoading && events.length === 0 ? (
            "Searching opportunities…"
          ) : (
            <>
              <span className="font-bold text-foreground">{total}</span>{" "}
              {total === 1 ? "event" : "events"} found
              {debouncedSearch && (
                <>
                  {" "}for “<span className="font-semibold text-foreground">{debouncedSearch}</span>”
                </>
              )}
              {category !== "All Events" && <> in {category}</>}
            </>
          )}
        </p>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="shrink-0 text-muted-foreground">
            <X /> Clear filters
          </Button>
        )}
      </div>

      {/* Results */}
      <div className="mt-6">
        {error && events.length === 0 ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : showSkeletons ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            title="No events match your search"
            description={
              status === "past"
                ? "No completed events match yet. Once initiatives wrap up, they will be archived here."
                : hasFilters
                  ? "Try a different keyword or category — or clear the filters to see everything happening."
                  : "No upcoming events right now. Check back soon, or create the first one as an organizer."
            }
            action={
              hasFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  <X /> Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className={cn("grid gap-6 transition-opacity sm:grid-cols-2 lg:grid-cols-3", isLoading && "opacity-60")}>
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
            {hasMore && (
              <div className="mt-10 text-center">
                <Button variant="outline" size="lg" onClick={() => setPage((p) => p + 1)} disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : <ChevronDown />}
                  Load more events
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
