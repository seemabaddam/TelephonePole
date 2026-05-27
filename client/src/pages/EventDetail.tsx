import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchEvent, getImageUrl } from "../api";
import type { EventDetail } from "../types";

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
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
        ← Back
      </Link>

      {loading && (
        <p className="mt-8 text-center text-sm text-gray-500">Loading…</p>
      )}

      {error && (
        <p className="mt-8 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {event && id && (
        <>
          <img
            src={getImageUrl(id)}
            alt={event.title}
            className="mt-6 w-full rounded-md"
          />
          <h1 className="mt-6 text-2xl font-bold">{event.title}</h1>
          <dl className="mt-4 space-y-2 text-sm text-gray-700">
            <div>
              <dt className="inline font-semibold">Event date: </dt>
              <dd className="inline">{new Date(event.eventDate).toLocaleDateString()}</dd>
            </div>
            {event.venue && (
              <div>
                <dt className="inline font-semibold">Venue: </dt>
                <dd className="inline">{event.venue}</dd>
              </div>
            )}
            {event.location && (
              <div>
                <dt className="inline font-semibold">Location: </dt>
                <dd className="inline">{event.location}</dd>
              </div>
            )}
            {event.description && (
              <div>
                <dt className="font-semibold">Description</dt>
                <dd className="mt-1 whitespace-pre-wrap">{event.description}</dd>
              </div>
            )}
            <div>
              <dt className="inline font-semibold">Posted: </dt>
              <dd className="inline">{new Date(event.uploadedAt).toLocaleDateString()}</dd>
            </div>
          </dl>
        </>
      )}
    </main>
  );
}
