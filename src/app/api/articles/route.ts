import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize";
import { slugify } from "@/lib/slugify";
import { z } from "zod";

const createArticleSchema = z.object({
  title: z.string().min(1).max(500),
  content: z.string(),
  excerpt: z.string().max(500).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  categoryId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
  changeNote: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("perPage") || "10");
  const status = searchParams.get("status");
  const categoryId = searchParams.get("categoryId");
  const authorId = searchParams.get("authorId");

  const session = await getServerSession(authOptions);
  const isEditor = session?.user?.role === "EDITOR" || session?.user?.role === "ADMIN";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {};
  if (status) {
    where.status = status;
  } else if (!isEditor) {
    where.status = "PUBLISHED";
  }
  if (categoryId) where.categoryId = categoryId;
  if (authorId) where.authorId = authorId;

  // Editors can only see their own articles (unless admin)
  if (session?.user?.role === "EDITOR") {
    where.authorId = session.user.id;
  }

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, email: true } },
        category: true,
        tags: { include: { tag: true } },
        _count: { select: { comments: { where: { isApproved: true } } } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.article.count({ where }),
  ]);

  return NextResponse.json({
    data: articles,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["EDITOR", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createArticleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { title, content, excerpt, status, categoryId, tagIds, changeNote } = parsed.data;
  const sanitizedContent = sanitizeHtml(content);

  // Generate unique slug
  let slug = slugify(title);
  const existing = await prisma.article.count({ where: { slug } });
  if (existing > 0) slug = `${slug}-${Date.now()}`;

  const article = await prisma.$transaction(async (tx) => {
    const created = await tx.article.create({
      data: {
        title,
        slug,
        content: sanitizedContent,
        excerpt: excerpt || null,
        status,
        authorId: session.user.id,
        categoryId: categoryId || null,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
        tags: tagIds?.length
          ? { create: tagIds.map((tagId) => ({ tagId })) }
          : undefined,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        category: true,
        tags: { include: { tag: true } },
      },
    });

    // Create first version
    await tx.articleVersion.create({
      data: {
        articleId: created.id,
        title,
        content: sanitizedContent,
        excerpt: excerpt || null,
        authorId: session.user.id,
        versionNumber: 1,
        changeNote: changeNote || "Initial version",
      },
    });

    return created;
  });

  return NextResponse.json(article, { status: 201 });
}
