import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { joinEventSchema } from "@/lib/validation";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await req.json().catch(() => null);
  const parsed = joinEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { name, slotIds } = parsed.data;

  const event = await prisma.event.findUnique({
    where: { slug },
    include: { slots: true },
  });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const validSlotIds = new Set(event.slots.map((s) => s.id));
  const filteredSlotIds = slotIds.filter((id) => validSlotIds.has(id));

  const participant = await prisma.participant.upsert({
    where: { eventId_name: { eventId: event.id, name } },
    create: { eventId: event.id, name },
    update: {},
  });

  await prisma.availability.deleteMany({ where: { participantId: participant.id } });
  if (filteredSlotIds.length > 0) {
    await prisma.availability.createMany({
      data: filteredSlotIds.map((slotId) => ({ participantId: participant.id, slotId })),
    });
  }

  return NextResponse.json({ ok: true, participantId: participant.id });
}
