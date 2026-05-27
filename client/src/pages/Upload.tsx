import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { uploadEvent } from "../api";
import {
  inputClass,
  labelClass,
  primaryButtonClass,
  errorClass,
  fileInputClass,
  pageClass,
  pageContentClass,
  pageTitleClass,
} from "../styles";

export default function Upload() {
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [venue, setVenue] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (selectedImage) URL.revokeObjectURL(selectedImage);
    };
  }, [selectedImage]);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    if (selectedImage) URL.revokeObjectURL(selectedImage);
    setFile(selected);
    setSelectedImage(selected ? URL.createObjectURL(selected) : null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) { setError("Please select an image."); return; }
    if (!title.trim()) { setError("Title is required."); return; }
    if (!eventDate) { setError("Event date is required."); return; }

    const formData = new FormData();
    formData.append("image", file);
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("eventDate", eventDate);
    formData.append("venue", venue.trim());
    formData.append("location", location.trim());

    setIsLoading(true);
    setError(null);
    try {
      const result = await uploadEvent(formData);
      navigate(`/events/${result._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className={pageClass}>
      <div className={pageContentClass}>
        <h1 className={pageTitleClass}>Post a Flyer</h1>

        {error && (
          <p className={errorClass}>
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelClass}>
              Image <span className="text-amber-500">*</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className={fileInputClass}
            />
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Preview"
                className="mt-3 max-h-64 w-full rounded object-contain border border-stone-700"
              />
            )}
          </div>

          <div>
            <label className={labelClass}>
              Title <span className="text-amber-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
              placeholder="Event name"
            />
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={inputClass}
              placeholder="Optional details about the event"
            />
          </div>

          <div>
            <label className={labelClass}>
              Event Date <span className="text-amber-500">*</span>
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Venue</label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className={inputClass}
              placeholder="Venue name (optional)"
            />
          </div>

          <div>
            <label className={labelClass}>Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={inputClass}
              placeholder="City or neighborhood (optional)"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full ${primaryButtonClass}`}
          >
            {isLoading ? "Uploading…" : "Submit"}
          </button>
        </form>
      </div>
    </main>
  );
}
