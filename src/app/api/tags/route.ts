import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(50),
});

export async function GET() {
  const tags = await prisma.tag.findMany({
    include: { _count: { select: { articles: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(tags);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["EDITOR", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { name } = parsed.data;
  let slug = slugify(name);
  const existing = await prisma.tag.count({ where: { slug } });
  if (existing > 0) slug = `${slug}-${Date.now()}`;

  const tag = await prisma.tag.create({ data: { name, slug } });
  return NextResponse.json(tag, { status: 201 });
}
