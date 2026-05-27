import { Link } from "react-router-dom";
import { getImageUrl } from "../api";
import type { EventSummary } from "../types";

interface Props {
  event: EventSummary;
}

export default function EventCard({ event }: Props) {
  return (
    <Link to={`/events/${event._id}`} className="block overflow-hidden rounded-md">
      <img
        src={getImageUrl(event._id)}
        alt={`Event on ${new Date(event.eventDate).toLocaleDateString()}`}
        className="w-full aspect-[3/4] object-cover hover:opacity-90 transition-opacity"
      />
    </Link>
  );
}
