import React, { useState, useEffect } from "react";
import { Plus, ChevronDown, ChevronUp, Edit, Trash, X } from "lucide-react";
import axios from "axios";

interface EventItem {
  id: number;
  title: string;
  categories: string[];
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  media_urls: string;
  description: string;
}

const EventsWidget: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);

  const [formData, setFormData] = useState<
    Omit<EventItem, "id" | "categories"> & { id?: number; categories: string[] }
  >({
    title: "",
    categories: [],
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    media_urls: "",
    description: "",
  });

  const [newCategory, setNewCategory] = useState("");

  // Fetch events
  const fetchEvents = async () => {
    try {
      const res = await axios.get("http://localhost:5000/events");

      const mapped = res.data.map((ev: any) => {
        const start = ev.start_time ? new Date(ev.start_time) : null;
        const end = ev.end_time ? new Date(ev.end_time) : null;

        const formatDate = (d: Date | null) =>
          d ? d.toLocaleDateString("en-CA") : "";
        const formatTime = (d: Date | null) =>
          d
            ? d.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";

        const cleanMediaUrls = (() => {
          if (!ev.media_urls) return "";

          let raw = ev.media_urls;
          if (raw.startsWith("{") && raw.endsWith("}")) {
            raw = raw.slice(1, -1);
          }

          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              return parsed.join(", ");
            }
            if (typeof parsed === "string") {
              return parsed;
            }
          } catch {
            // fallback
          }

          return raw;
        })();

        return {
          id: ev.event_id,
          title: ev.event_name,
          categories: ev.event_categories || [],
          date: formatDate(start),
          startTime: formatTime(start),
          endTime: formatTime(end),
          location: ev.location || "",
          media_urls: cleanMediaUrls,
          description: ev.description || "",
        };
      });

      setEvents(mapped);
    } catch (err) {
      console.error("Error fetching events:", err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const startISO =
      formData.date && formData.startTime
        ? `${formData.date}T${formData.startTime}:00`
        : null;
    const endISO =
      formData.date && formData.endTime
        ? `${formData.date}T${formData.endTime}:00`
        : null;

    const mediaArray = formData.media_urls
      ? formData.media_urls.split(",").map((url) => url.trim())
      : [];

    const payload = {
      event_name: formData.title,
      event_categories: formData.categories,
      start_time: startISO,
      end_time: endISO,
      location: formData.location,
      description: formData.description,
      media_urls: mediaArray,
    };

    try {
      if (formData.id) {
        await axios.put(`http://localhost:5000/events/${formData.id}`, payload);
        alert("Event updated successfully!");
      } else {
        await axios.post("http://localhost:5000/events", payload);
        alert("Event created successfully!");
      }
      await fetchEvents();
    } catch (err: any) {
      console.error("Error saving event:", err);
      if (err.response) {
        alert(
          "Update failed: " +
            (err.response.data.message || JSON.stringify(err.response.data))
        );
      } else {
        alert("Update failed: check console for details.");
      }
    }

    setFormData({
      title: "",
      categories: [],
      date: "",
      startTime: "",
      endTime: "",
      location: "",
      media_urls: "",
      description: "",
    });
    setNewCategory("");
    setShowForm(false);
  };

  const handleEdit = (event: EventItem) => {
    setFormData({
      id: event.id,
      title: event.title,
      categories: [...event.categories],
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      media_urls: event.media_urls,
      description: event.description,
    });
    setNewCategory("");
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`http://localhost:5000/events/${id}`);
      fetchEvents();
    } catch (err) {
      console.error("Error deleting event:", err);
    }
  };

  const addCategory = () => {
    if (newCategory.trim()) {
      setFormData({
        ...formData,
        categories: [...formData.categories, newCategory.trim()],
      });
      setNewCategory("");
    }
  };

  const removeCategory = (cat: string) => {
    setFormData({
      ...formData,
      categories: formData.categories.filter((c) => c !== cat),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button
          onClick={() => {
            setFormData({
              title: "",
              categories: [],
              date: "",
              startTime: "",
              endTime: "",
              location: "",
              media_urls: "",
              description: "",
            });
            setNewCategory("");
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={16} /> Add Event
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">
              {formData.id ? "Edit Event" : "Add Event"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full border rounded p-2"
                required
              />

              {/* Categories */}
              <div>
                <label className="block font-medium mb-1">Categories</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add a category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="flex-1 border rounded p-2"
                  />
                  <button
                    type="button"
                    onClick={addCategory}
                    className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    +
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.categories.map((cat, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-200 rounded flex items-center gap-1"
                    >
                      {cat}
                      <button
                        type="button"
                        onClick={() => removeCategory(cat)}
                        className="text-red-600"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full border rounded p-2"
              />
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
                className="w-full border rounded p-2"
              />
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
                className="w-full border rounded p-2"
              />
              <input
                type="text"
                placeholder="Location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="w-full border rounded p-2"
              />
              <input
                type="text"
                placeholder="Media URLs (comma-separated)"
                value={formData.media_urls}
                onChange={(e) =>
                  setFormData({ ...formData, media_urls: e.target.value })
                }
                className="w-full border rounded p-2"
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full border rounded p-2"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {formData.id ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="space-y-3">
        {events.map((ev) => (
          <div key={ev.id} className="border rounded-lg bg-white shadow-sm">
            <button
              onClick={() => setExpanded(expanded === ev.id ? null : ev.id)}
              className="w-full flex justify-between items-center px-4 py-3 text-left font-medium hover:bg-gray-50"
            >
              {ev.title} (ID: {ev.id})
              {expanded === ev.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {expanded === ev.id && (
              <div className="px-4 pb-4 space-y-2">
                <p>
                  <span className="font-semibold">Categories:</span>{" "}
                  {ev.categories.join(", ")}
                </p>
                <p>
                  <span className="font-semibold">Date:</span> {ev.date}
                </p>
                <p>
                  <span className="font-semibold">Time:</span> {ev.startTime} -{" "}
                  {ev.endTime}
                </p>
                <p>
                  <span className="font-semibold">Location:</span>{" "}
                  {ev.location}
                </p>
                <p>
                  <span className="font-semibold">Media URLs:</span>{" "}
                  {ev.media_urls}
                </p>
                <p>
                  <span className="font-semibold">Description:</span>{" "}
                  {ev.description}
                </p>
                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => handleEdit(ev)}
                    className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    <Edit size={14} className="inline-block mr-1" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(ev.id)}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    <Trash size={14} className="inline-block mr-1" /> Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventsWidget;
