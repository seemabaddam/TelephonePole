import { useState, useEffect, type FormEvent } from "react";
import type { EventFilters } from "../types";
import { baseInputClass, labelClass, primaryButtonClass } from "../styles";

interface Props {
  filters: EventFilters;
  onFiltersChange: (filters: EventFilters) => void;
}

interface Draft {
  eventAfter: string;
  eventBefore: string;
  location: string;
  sort: "" | "uploadedAt" | "eventDate";
}

const emptyDraft: Draft = {
  eventAfter: "",
  eventBefore: "",
  location: "",
  sort: "",
};

function filtersToDraft(filters: EventFilters): Draft {
  return {
    eventAfter: filters.eventAfter ?? "",
    eventBefore: filters.eventBefore ?? "",
    location: filters.location ?? "",
    sort: filters.sort ?? "",
  };
}

function isDirty(draft: Draft): boolean {
  return Object.values(draft).some((v) => v !== "");
}

export default function FilterBar({ filters, onFiltersChange }: Props) {
  const [draft, setDraft] = useState<Draft>(() => filtersToDraft(filters));

  useEffect(() => {
    setDraft(filtersToDraft(filters));
  }, [filters]);

  function handleApply(e: FormEvent) {
    e.preventDefault();
    const next: EventFilters = {};
    if (draft.eventAfter) next.eventAfter = draft.eventAfter;
    if (draft.eventBefore) next.eventBefore = draft.eventBefore;
    if (draft.location.trim()) next.location = draft.location.trim();
    if (draft.sort) next.sort = draft.sort;
    onFiltersChange(next);
  }

  function handleClear() {
    setDraft(emptyDraft);
    onFiltersChange({});
  }

  const set = (field: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setDraft((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <form onSubmit={handleApply} className="flex flex-wrap justify-center gap-x-8 gap-y-4 items-end">
      <div>
        <p className={labelClass}>Event date (range)</p>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={draft.eventAfter}
            onChange={set("eventAfter")}
            className={`w-36 ${baseInputClass}`}
            title="From"
          />
          <span className="text-stone-500 text-sm">–</span>
          <input
            type="date"
            value={draft.eventBefore}
            onChange={set("eventBefore")}
            className={`w-36 ${baseInputClass}`}
            title="To"
          />
        </div>
      </div>

      <div>
        <p className={labelClass}>Location</p>
        <input
          type="text"
          value={draft.location}
          onChange={set("location")}
          placeholder="City or neighborhood"
          className={`w-48 ${baseInputClass}`}
        />
      </div>

      <div>
        <p className={labelClass}>Sort by</p>
        <select
          value={draft.sort}
          onChange={set("sort")}
          className={`w-40 ${baseInputClass}`}
        >
          <option value="">Event date</option>
          <option value="uploadedAt">Newest upload</option>
        </select>
      </div>

      <button type="submit" className={primaryButtonClass}>
        Apply
      </button>

      {isDirty(draft) && (
        <button
          type="button"
          onClick={handleClear}
          className="text-sm text-stone-500 hover:text-amber-400 underline"
        >
          Clear
        </button>
      )}
    </form>
  );
}
