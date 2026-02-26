import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize";
import { slugify } from "@/lib/slugify";
import { z } from "zod";

const updateArticleSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().optional(),
  excerpt: z.string().max(500).nullable().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  categoryId: z.string().nullable().optional(),
  tagIds: z.array(z.string()).optional(),
  changeNote: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const article = await prisma.article.findUnique({
    where: { id: params.id },
    include: {
      author: { select: { id: true, name: true, email: true } },
      category: true,
      tags: { include: { tag: true } },
      _count: { select: { comments: { where: { isApproved: true } } } },
    },
  });

  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const session = await getServerSession(authOptions);
  const isEditor = session?.user?.role === "EDITOR" || session?.user?.role === "ADMIN";
  if (article.status !== "PUBLISHED" && !isEditor) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(article);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["EDITOR", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const article = await prisma.article.findUnique({ where: { id: params.id } });
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Editors can only update their own articles
  if (session.user.role === "EDITOR" && article.authorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateArticleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { title, content, excerpt, status, categoryId, tagIds, changeNote } = parsed.data;
  const sanitizedContent = content ? sanitizeHtml(content) : undefined;

  const updated = await prisma.$transaction(async (tx) => {
    // Determine next version number
    const lastVersion = await tx.articleVersion.aggregate({
      where: { articleId: params.id },
      _max: { versionNumber: true },
    });
    const nextVersion = (lastVersion._max.versionNumber || 0) + 1;

    // Create version snapshot
    await tx.articleVersion.create({
      data: {
        articleId: params.id,
        title: title || article.title,
        content: sanitizedContent || article.content,
        excerpt: excerpt !== undefined ? excerpt : article.excerpt,
        authorId: session.user.id,
        versionNumber: nextVersion,
        changeNote: changeNote || `Version ${nextVersion}`,
      },
    });

    // Handle slug update
    let slug = article.slug;
    if (title && title !== article.title) {
      const newSlug = slugify(title);
      const existing = await tx.article.count({
        where: { slug: newSlug, id: { not: params.id } },
      });
      slug = existing > 0 ? `${newSlug}-${Date.now()}` : newSlug;
    }

    // Handle tags
    if (tagIds !== undefined) {
      await tx.articleTag.deleteMany({ where: { articleId: params.id } });
      if (tagIds.length > 0) {
        await tx.articleTag.createMany({
          data: tagIds.map((tagId) => ({ articleId: params.id, tagId })),
        });
      }
    }

    return tx.article.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title, slug }),
        ...(sanitizedContent !== undefined && { content: sanitizedContent }),
        ...(excerpt !== undefined && { excerpt }),
        ...(status !== undefined && {
          status,
          publishedAt:
            status === "PUBLISHED" && article.status !== "PUBLISHED"
              ? new Date()
              : article.publishedAt,
        }),
        ...(categoryId !== undefined && { categoryId }),
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        category: true,
        tags: { include: { tag: true } },
      },
    });
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["EDITOR", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const article = await prisma.article.findUnique({ where: { id: params.id } });
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "EDITOR" && article.authorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.article.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
