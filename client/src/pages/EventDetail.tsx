import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchEvent, getImageUrl } from "../api";
import type { EventDetail } from "../types";
import { pageClass, pageContentClass, backLinkClass } from "../styles";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loading = event === null && error === null;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetchEvent(id).then(
      (data) => { if (!cancelled) setEvent(data); },
      (err) => { if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load event."); },
    );
    return () => { cancelled = true; };
  }, [id]);

  return (
    <main className={pageClass}>
      <div className={pageContentClass}>
        <Link to="/" className={backLinkClass}>
          ← Back
        </Link>

        {loading && (
          <p className="mt-8 text-center text-sm text-stone-400">Loading…</p>
        )}

        {error && (
          <p className="mt-8 rounded border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-400">{error}</p>
        )}

        {event && id && (
          <>
            <img
              src={getImageUrl(id)}
              alt={event.title}
              className="mt-6 w-full rounded"
            />
            <h1 className="mt-6 text-2xl font-bold text-stone-100">{event.title}</h1>
            <dl className="mt-4 space-y-2 text-sm text-stone-300">
              <div>
                <dt className="inline font-semibold text-stone-400">Event date: </dt>
                <dd className="inline">{new Date(event.eventDate).toLocaleDateString()}</dd>
              </div>
              {event.venue && (
                <div>
                  <dt className="inline font-semibold text-stone-400">Venue: </dt>
                  <dd className="inline">{event.venue}</dd>
                </div>
              )}
              {event.location && (
                <div>
                  <dt className="inline font-semibold text-stone-400">Location: </dt>
                  <dd className="inline">{event.location}</dd>
                </div>
              )}
              {event.description && (
                <div>
                  <dt className="font-semibold text-stone-400">Description</dt>
                  <dd className="mt-1 whitespace-pre-wrap">{event.description}</dd>
                </div>
              )}
              <div>
                <dt className="inline font-semibold text-stone-400">Posted: </dt>
                <dd className="inline">{new Date(event.uploadedAt).toLocaleDateString()}</dd>
              </div>
            </dl>
          </>
        )}
      </div>
    </main>
  );
}
