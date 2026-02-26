import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  versionId: z.string(),
  changeNote: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["EDITOR", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const article = await prisma.article.findUnique({ where: { id: params.id } });
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "EDITOR" && article.authorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const version = await prisma.articleVersion.findUnique({
    where: { id: parsed.data.versionId },
  });
  if (!version || version.articleId !== params.id) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const lastVersion = await tx.articleVersion.aggregate({
      where: { articleId: params.id },
      _max: { versionNumber: true },
    });
    const nextVersion = (lastVersion._max.versionNumber || 0) + 1;

    await tx.articleVersion.create({
      data: {
        articleId: params.id,
        title: version.title,
        content: version.content,
        excerpt: version.excerpt,
        authorId: session.user.id,
        versionNumber: nextVersion,
        changeNote: parsed.data.changeNote || `Restored from version ${version.versionNumber}`,
      },
    });

    return tx.article.update({
      where: { id: params.id },
      data: {
        title: version.title,
        content: version.content,
        excerpt: version.excerpt,
      },
    });
  });

  return NextResponse.json(updated);
}
