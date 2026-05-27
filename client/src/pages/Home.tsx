import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { fetchEvents } from "../api";
import type { EventSummary, EventFilters } from "../types";
import EventCard from "../components/EventCard";
import FilterBar from "../components/FilterBar";
import {
  errorClass,
  primaryButtonClass,
  polePageClass,
  poleHeaderClass,
  poleScrollClass,
  poleColumnClass,
  posterRowClass,
} from "../styles";
import { POSTER_OVERLAP_PX, POSTER_ROTATIONS } from "../constants";

export default function Home() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<EventFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const isFirstRender = useRef(true);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
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
    if (isFirstRender.current) {
      isFirstRender.current = false;
    } else {
      setShowFilters(false);
    }
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
      { root: scrollRef.current, rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [nextCursor, filters, loadPage]);

  return (
    <div className={polePageClass}>
      <header className={poleHeaderClass}>
        <button
          onClick={() => setFilters({})}
          className="text-xl font-bold text-stone-100 tracking-wide hover:text-amber-400 transition-colors"
        >
          TelephonePole
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="text-sm text-stone-400 hover:text-amber-400 transition-colors"
          >
            {showFilters ? "Hide filters" : "Filter"}
          </button>
          <Link
            to="/upload"
            className={primaryButtonClass}
          >
            Post a Flyer
          </Link>
        </div>
      </header>

      {showFilters && (
        <div className="flex-none bg-stone-900 border-b border-stone-800 px-4 py-4">
          <FilterBar filters={filters} onFiltersChange={setFilters} />
        </div>
      )}

      {error && (
        <div className="flex-none px-4 pt-4">
          <p className={errorClass}>{error}</p>
        </div>
      )}

      <div ref={scrollRef} className={poleScrollClass}>
        <div className={poleColumnClass}>
          {Array.from({ length: Math.ceil(events.length / 4) }, (_, rowIdx) => {
            const rowEvents = events.slice(rowIdx * 4, rowIdx * 4 + 4);
            return (
              <div
                key={rowEvents[0]._id}
                className={posterRowClass}
                style={{
                  zIndex: Math.ceil(events.length / 4) - rowIdx,
                  marginTop: rowIdx === 0 ? 0 : -POSTER_OVERLAP_PX,
                }}
              >
                {rowEvents.map((event, colIdx) => (
                  <EventCard
                    key={event._id}
                    event={event}
                    rotation={POSTER_ROTATIONS[(rowIdx * 4 + colIdx) % POSTER_ROTATIONS.length]}
                  />
                ))}
              </div>
            );
          })}
        </div>

        {loading && (
          <p className="py-8 text-center text-sm text-stone-400">Loading…</p>
        )}

        {!loading && events.length === 0 && !error && (
          <p className="py-8 text-center text-sm text-stone-400">No events found.</p>
        )}

        <div ref={sentinelRef} className="h-1" />
      </div>
    </div>
  );
}
