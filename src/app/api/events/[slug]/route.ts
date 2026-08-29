import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      slots: {
        orderBy: { start: "asc" },
        include: { responses: { include: { participant: true } } },
      },
      participants: true,
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: event.id,
    slug: event.slug,
    title: event.title,
    description: event.description,
    organizerName: event.organizerName,
    duration: event.duration,
    timezone: event.timezone,
    status: event.status,
    finalSlotId: event.finalSlotId,
    createdAt: event.createdAt,
    participants: event.participants.map((p) => ({
      id: p.id,
      name: p.name,
      confirmed: p.confirmed,
    })),
    slots: event.slots.map((s) => ({
      id: s.id,
      start: s.start,
      end: s.end,
      participantNames: s.responses.map((r) => r.participant.name),
    })),
  });
}
