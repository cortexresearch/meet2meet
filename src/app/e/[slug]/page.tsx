"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import AvailabilitySkyline, { SkylineSlot } from "@/components/AvailabilitySkyline";

type EventData = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  organizerName: string;
  duration: number;
  status: string;
  finalSlotId: string | null;
  participants: { id: string; name: string; confirmed: boolean | null }[];
  slots: { id: string; start: string; end: string; participantNames: string[] }[];
};

export default function EventPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [event, setEvent] = useState<EventData | null>(null);
  const [name, setName] = useState("");
  const [mySelection, setMySelection] = useState<Set<string>>(new Set());
  const [joined, setJoined] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rsvpName, setRsvpName] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/events/${slug}`, { cache: "no-store" });
    if (res.ok) setEvent(await res.json());
  }, [slug]);

  useEffect(() => {
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    const storedName = localStorage.getItem(`m2m:name:${slug}`);
    if (storedName) {
      setName(storedName);
      setRsvpName(storedName);
      setJoined(true);
    }
  }, [slug]);

  useEffect(() => {
    if (!event || !name) return;
    const mine = event.slots.filter((s) => s.participantNames.includes(name)).map((s) => s.id);
    if (mine.length > 0) setMySelection(new Set(mine));
  }, [event, name]);

  const skylineSlots: SkylineSlot[] = useMemo(
    () =>
      event?.slots.map((s) => ({
        id: s.id,
        start: s.start,
        end: s.end,
        count: s.participantNames.length,
        names: s.participantNames,
      })) ?? [],
    [event]
  );

  const ranked = useMemo(
    () => [...skylineSlots].sort((a, b) => b.count - a.count || new Date(a.start).getTime() - new Date(b.start).getTime()),
    [skylineSlots]
  );

  const finalSlot = event?.slots.find((s) => s.id === event.finalSlotId) ?? null;

  async function submitAvailability() {
    if (!name.trim() || !event) return;
    setSaving(true);
    try {
      await fetch(`/api/events/${slug}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slotIds: Array.from(mySelection) }),
      });
      localStorage.setItem(`m2m:name:${slug}`, name);
      setJoined(true);
      setRsvpName(name);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function pickSlot(slotId: string) {
    if (!confirm("Lock this in as the meeting time? Everyone will be asked to confirm.")) return;
    await fetch(`/api/events/${slug}/pick`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotId }),
    });
    await load();
  }

  async function rsvp(confirmed: boolean) {
    if (!rsvpName.trim()) return;
    await fetch(`/api/events/${slug}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: rsvpName, confirmed }),
    });
    localStorage.setItem(`m2m:name:${slug}`, rsvpName);
    await load();
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function copyReminder() {
    if (!finalSlot) return;
    const text = `Reminder: "${event?.title}" is set for ${format(
      new Date(finalSlot.start),
      "EEEE, MMM d 'at' h:mm a"
    )}. Confirm you're coming: ${window.location.href}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!event) {
    return (
      <main className="flex-1 flex items-center justify-center text-slate-400">
        Loading…
      </main>
    );
  }

  const confirmedCount = event.participants.filter((p) => p.confirmed === true).length;
  const declinedCount = event.participants.filter((p) => p.confirmed === false).length;

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                event.status === "decided"
                  ? "bg-amber-500/15 text-amber-400"
                  : "bg-sky-500/15 text-sky-400"
              }`}
            >
              {event.status === "decided" ? "Time locked" : "Collecting availability"}
            </span>
            <h1 className="mt-2 text-3xl font-bold text-white">{event.title}</h1>
            {event.description && <p className="mt-1 text-slate-400">{event.description}</p>}
            <p className="mt-1 text-sm text-slate-500">
              Organized by {event.organizerName} · {event.duration} min
            </p>
          </div>
          <button
            onClick={copyLink}
            className="rounded-full border border-white/15 px-4 py-2 text-sm text-white hover:border-white/30"
          >
            {copied ? "Copied!" : "Copy share link"}
          </button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <AvailabilitySkyline
              slots={skylineSlots}
              selectedIds={mySelection}
              finalSlotId={event.finalSlotId}
              mode={event.status === "decided" ? "view" : "select"}
              onBarClick={(id) => {
                setMySelection((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                });
              }}
            />
            <p className="mt-3 text-center text-xs text-slate-500">
              Drag to rotate · taller / greener bars = more people free. Click a bar to
              toggle your own availability.
            </p>
          </div>

          <aside className="space-y-6">
            {event.status !== "decided" && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h2 className="font-semibold text-white">
                  {joined ? "Update your availability" : "Add your availability"}
                </h2>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="mt-3 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Click bars in the skyline to mark times you&apos;re free, then save.
                </p>
                <button
                  onClick={submitAvailability}
                  disabled={saving || !name.trim()}
                  className="mt-3 w-full rounded-full bg-amber-500 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save my availability"}
                </button>
              </div>
            )}

            {event.status !== "decided" && ranked.length > 0 && ranked[0].count > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h2 className="font-semibold text-white">Top options</h2>
                <ul className="mt-3 space-y-2">
                  {ranked.slice(0, 3).map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-sm"
                    >
                      <div>
                        <div className="text-white">{format(new Date(s.start), "EEE h:mm a")}</div>
                        <div className="text-xs text-slate-500">
                          {s.count} {s.count === 1 ? "person" : "people"} free
                        </div>
                      </div>
                      <button
                        onClick={() => pickSlot(s.id)}
                        className="rounded-full border border-amber-400/40 px-3 py-1 text-xs font-medium text-amber-400 hover:bg-amber-400/10"
                      >
                        Lock in
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {event.status === "decided" && finalSlot && (
              <div className="rounded-2xl border border-amber-400/30 bg-amber-500/5 p-5">
                <h2 className="font-semibold text-amber-400">It&apos;s happening</h2>
                <p className="mt-2 text-lg font-semibold text-white">
                  {format(new Date(finalSlot.start), "EEEE, MMM d")}
                </p>
                <p className="text-slate-300">
                  {format(new Date(finalSlot.start), "h:mm a")} –{" "}
                  {format(new Date(finalSlot.end), "h:mm a")} (your local time)
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={`/api/events/${slug}/ics`}
                    className="rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400"
                  >
                    Download .ics invite
                  </a>
                  <button
                    onClick={copyReminder}
                    className="rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-white hover:border-white/30"
                  >
                    Copy reminder message
                  </button>
                </div>
              </div>
            )}

            {event.status === "decided" && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h2 className="font-semibold text-white">Confirm you&apos;re coming</h2>
                <input
                  value={rsvpName}
                  onChange={(e) => setRsvpName(e.target.value)}
                  placeholder="Your name"
                  className="mt-3 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none"
                />
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => rsvp(true)}
                    className="flex-1 rounded-full bg-emerald-500/90 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
                  >
                    I&apos;ll be there
                  </button>
                  <button
                    onClick={() => rsvp(false)}
                    className="flex-1 rounded-full border border-red-400/40 py-2 text-sm font-semibold text-red-400 hover:bg-red-400/10"
                  >
                    Can&apos;t make it
                  </button>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  {confirmedCount} confirmed · {declinedCount} declined ·{" "}
                  {event.participants.length - confirmedCount - declinedCount} pending
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="font-semibold text-white">Participants ({event.participants.length})</h2>
              <ul className="mt-3 space-y-1.5 text-sm">
                {event.participants.map((p) => (
                  <li key={p.id} className="flex items-center justify-between text-slate-300">
                    <span>{p.name}</span>
                    {event.status === "decided" && (
                      <span>
                        {p.confirmed === true ? "✅" : p.confirmed === false ? "❌" : "⏳"}
                      </span>
                    )}
                  </li>
                ))}
                {event.participants.length === 0 && (
                  <li className="text-slate-500">No one yet — share the link!</li>
                )}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
