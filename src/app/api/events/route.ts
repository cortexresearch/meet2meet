import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateSlug } from "@/lib/slug";
import { createEventSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { title, description, organizerName, duration, timezone, slots } = parsed.data;

  let slug = generateSlug();
  // Extremely unlikely collision, but guard anyway.
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await prisma.event.findUnique({ where: { slug } });
    if (!existing) break;
    slug = generateSlug();
  }

  const event = await prisma.event.create({
    data: {
      slug,
      title,
      description,
      organizerName,
      duration,
      timezone,
      slots: {
        create: slots.map((s) => ({ start: new Date(s.start), end: new Date(s.end) })),
      },
    },
    select: { slug: true },
  });

  return NextResponse.json({ slug: event.slug }, { status: 201 });
}
