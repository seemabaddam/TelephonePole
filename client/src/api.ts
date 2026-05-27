import type { EventDetail, EventFilters, EventListResponse } from "./types";

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

export async function fetchEvents(filters: EventFilters = {}): Promise<EventListResponse> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined) {
      params.set(key, String(value));
    }
  }
  const query = params.size > 0 ? `?${params.toString()}` : "";
  return apiFetch<EventListResponse>(`/api/events${query}`);
}

export async function fetchEvent(id: string): Promise<EventDetail> {
  return apiFetch<EventDetail>(`/api/events/${id}`);
}

export async function uploadEvent(formData: FormData): Promise<EventDetail> {
  return apiFetch<EventDetail>("/api/events", { method: "POST", body: formData });
}

export function getImageUrl(id: string): string {
  return `${API_BASE}/api/events/${id}/image`;
}
