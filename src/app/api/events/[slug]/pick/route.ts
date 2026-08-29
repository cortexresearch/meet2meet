import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { pickSlotSchema } from "@/lib/validation";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await req.json().catch(() => null);
  const parsed = pickSlotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const event = await prisma.event.findUnique({
    where: { slug },
    include: { slots: true },
  });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  const slot = event.slots.find((s) => s.id === parsed.data.slotId);
  if (!slot) {
    return NextResponse.json({ error: "Slot does not belong to this event" }, { status: 400 });
  }

  await prisma.event.update({
    where: { id: event.id },
    data: { status: "decided", finalSlotId: slot.id },
  });

  return NextResponse.json({ ok: true });
}
