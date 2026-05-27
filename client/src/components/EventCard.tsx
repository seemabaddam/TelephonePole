import { Link } from "react-router-dom";
import { getImageUrl } from "../api";
import type { EventSummary } from "../types";
import { posterCardClass } from "../styles";

interface Props {
  event: EventSummary;
  rotation?: number;
}

export default function EventCard({ event, rotation = 0 }: Props) {
  return (
    <Link to={`/events/${event._id}`} className="block">
      <img
        src={getImageUrl(event._id)}
        alt={`Event on ${new Date(event.eventDate).toLocaleDateString()}`}
        className={posterCardClass}
        style={{ transform: `rotate(${rotation}deg)` }}
      />
    </Link>
  );
}
