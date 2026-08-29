import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { confirmSchema } from "@/lib/validation";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await req.json().catch(() => null);
  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const participant = await prisma.participant.upsert({
    where: { eventId_name: { eventId: event.id, name: parsed.data.name } },
    create: { eventId: event.id, name: parsed.data.name, confirmed: parsed.data.confirmed },
    update: { confirmed: parsed.data.confirmed },
  });

  return NextResponse.json({ ok: true, participantId: participant.id });
}
