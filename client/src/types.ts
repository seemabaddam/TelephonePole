export interface EventSummary {
  _id: string;
  eventDate: string;
  venue: string | undefined;
  location: string | undefined;
  uploadedAt: string;
  imageUrl: string;
}

export interface EventDetail extends EventSummary {
  title: string;
  description: string | undefined;
}

export interface EventListResponse {
  events: EventSummary[];
  nextCursor: string | null;
}

export interface EventFilters {
  cursor?: string;
  limit?: number;
  uploadedAfter?: string;
  uploadedBefore?: string;
  eventAfter?: string;
  eventBefore?: string;
  location?: string;
  sort?: "uploadedAt" | "eventDate";
}
