import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(100),
  parentId: z.string().nullable().optional(),
  order: z.number().int().default(0),
});

export async function GET() {
  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { articles: { where: { status: "PUBLISHED" } } } },
      children: {
        include: {
          _count: { select: { articles: { where: { status: "PUBLISHED" } } } },
        },
        orderBy: { order: "asc" },
      },
    },
    where: { parentId: null },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { name, parentId, order } = parsed.data;
  let slug = slugify(name);
  const existing = await prisma.category.count({ where: { slug } });
  if (existing > 0) slug = `${slug}-${Date.now()}`;

  const category = await prisma.category.create({
    data: { name, slug, parentId: parentId || null, order },
  });

  return NextResponse.json(category, { status: 201 });
}
