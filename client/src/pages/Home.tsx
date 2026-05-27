import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { fetchEvents } from "../api";
import type { EventSummary, EventFilters } from "../types";
import EventCard from "../components/EventCard";
import FilterBar from "../components/FilterBar";
import { errorClass } from "../styles";

export default function Home() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<EventFilters>({});
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const loadPage = useCallback(async (cursor: string | undefined, currentFilters: EventFilters) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const data = await fetchEvents({ ...currentFilters, cursor });
      setEvents((prev) => (cursor ? [...prev, ...data.events] : data.events));
      setNextCursor(data.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events.");
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    setEvents([]);
    setNextCursor(null);
    loadPage(undefined, filters);
  }, [filters, loadPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextCursor && !loadingRef.current) {
          loadPage(nextCursor, filters);
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [nextCursor, filters, loadPage]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">TelephonePole</h1>
        <Link
          to="/upload"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Post a Flyer
        </Link>
      </header>

      <FilterBar filters={filters} onFiltersChange={setFilters} />

      {error && (
        <p className={errorClass}>{error}</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {events.map((event) => (
          <EventCard key={event._id} event={event} />
        ))}
      </div>

      {loading && (
        <p className="mt-8 text-center text-sm text-gray-500">Loading…</p>
      )}

      {!loading && events.length === 0 && !error && (
        <p className="mt-8 text-center text-sm text-gray-500">No events found.</p>
      )}

      <div ref={sentinelRef} className="h-1" />
    </main>
  );
}
