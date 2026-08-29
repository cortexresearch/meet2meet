import { createEvent } from "ics";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const event = await prisma.event.findUnique({
    where: { slug },
    include: { slots: true, participants: true },
  });

  if (!event || !event.finalSlotId) {
    return new Response("No confirmed time yet", { status: 404 });
  }

  const slot = event.slots.find((s) => s.id === event.finalSlotId);
  if (!slot) {
    return new Response("Slot not found", { status: 404 });
  }

  const start = slot.start;
  const attendees = event.participants
    .filter((p) => p.name)
    .map((p) => ({ name: p.name }));

  const { error, value } = createEvent({
    title: event.title,
    description: event.description || "Scheduled with Group Meeting Coordinator",
    start: [
      start.getUTCFullYear(),
      start.getUTCMonth() + 1,
      start.getUTCDate(),
      start.getUTCHours(),
      start.getUTCMinutes(),
    ],
    startInputType: "utc",
    duration: { minutes: event.duration },
    organizer: { name: event.organizerName },
    attendees,
    status: "CONFIRMED",
    productId: "group-meeting-coordinator",
  });

  if (error || !value) {
    return new Response("Failed to generate calendar file", { status: 500 });
  }

  return new Response(value, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}.ics"`,
    },
  });
}
