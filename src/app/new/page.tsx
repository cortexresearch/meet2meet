"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DURATIONS = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "1 hour", value: 60 },
  { label: "1.5 hours", value: 90 },
  { label: "2 hours", value: 120 },
];

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function NewEventPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [duration, setDuration] = useState(30);
  const [dates, setDates] = useState<string[]>(() => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return [toISODate(t)];
  });
  const [dateInput, setDateInput] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addDate() {
    if (!dateInput) return;
    if (!dates.includes(dateInput)) {
      setDates([...dates, dateInput].sort());
    }
    setDateInput("");
  }

  function removeDate(d: string) {
    setDates(dates.filter((x) => x !== d));
  }

  function buildSlots() {
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const slots: { start: string; end: string }[] = [];

    for (const dateStr of dates) {
      const [y, m, d] = dateStr.split("-").map(Number);
      const dayStart = new Date(y, m - 1, d, startH, startM, 0, 0);
      const dayEnd = new Date(y, m - 1, d, endH, endM, 0, 0);
      let cursor = new Date(dayStart);
      while (cursor.getTime() + duration * 60000 <= dayEnd.getTime()) {
        const slotEnd = new Date(cursor.getTime() + duration * 60000);
        slots.push({ start: cursor.toISOString(), end: slotEnd.toISOString() });
        cursor = slotEnd;
      }
    }
    return slots;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !organizerName.trim()) {
      setError("Title and your name are required.");
      return;
    }
    if (dates.length === 0) {
      setError("Add at least one candidate date.");
      return;
    }
    const slots = buildSlots();
    if (slots.length === 0) {
      setError("Your time window is too short for the selected duration.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          organizerName,
          duration,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          slots,
        }),
      });
      if (!res.ok) throw new Error("Failed to create meeting");
      const data = await res.json();
      router.push(`/e/${data.slug}`);
    } catch {
      setError("Something went wrong. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="flex-1 px-6 py-16">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-bold text-white">Create a meeting</h1>
        <p className="mt-2 text-slate-400">
          Pick your candidate dates and a daily window — we&apos;ll slice it into
          time slots people can vote on.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300">Meeting title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Q3 planning sync"
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">
              Description <span className="text-slate-500">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What's this about?"
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Your name</label>
            <input
              value={organizerName}
              onChange={(e) => setOrganizerName(e.target.value)}
              placeholder="Jordan"
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Meeting length</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-amber-400/50 focus:outline-none"
            >
              {DURATIONS.map((d) => (
                <option key={d.value} value={d.value} className="bg-slate-900">
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300">Window starts</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-amber-400/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">Window ends</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-amber-400/50 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Candidate dates</label>
            <div className="mt-1.5 flex gap-2">
              <input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-amber-400/50 focus:outline-none"
              />
              <button
                type="button"
                onClick={addDate}
                className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-white hover:border-white/30"
              >
                Add
              </button>
            </div>
            {dates.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {dates.map((d) => (
                  <span
                    key={d}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-200"
                  >
                    {d}
                    <button
                      type="button"
                      onClick={() => removeDate(d)}
                      className="text-slate-500 hover:text-red-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-amber-500 py-3 font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create meeting & get shareable link"}
          </button>
        </form>
      </div>
    </main>
  );
}
