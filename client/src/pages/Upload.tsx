import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { uploadEvent } from "../api";

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

  const inputClass =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <main className="mx-auto max-w-lg py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Upload a Poster</h1>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={labelClass}>
            Image <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
          />
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Preview"
              className="mt-3 max-h-64 w-full rounded-md object-contain border border-gray-200"
            />
          )}
        </div>

        <div>
          <label className={labelClass}>
            Title <span className="text-red-500">*</span>
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
            Event Date <span className="text-red-500">*</span>
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
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Uploading…" : "Submit"}
        </button>
      </form>
    </main>
  );
}
