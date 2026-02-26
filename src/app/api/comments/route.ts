import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSiteConfig } from "@/lib/config";
import { z } from "zod";

const createSchema = z.object({
  content: z.string().min(1).max(5000),
  articleId: z.string(),
  parentId: z.string().nullable().optional(),
  authorName: z.string().max(100).optional(),
  authorEmail: z.string().email().optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const articleId = searchParams.get("articleId");
  if (!articleId) return NextResponse.json({ error: "articleId required" }, { status: 400 });

  const comments = await prisma.comment.findMany({
    where: { articleId, isApproved: true, parentId: null },
    include: {
      author: { select: { id: true, name: true, email: true } },
      replies: {
        where: { isApproved: true },
        include: { author: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ data: comments, total: comments.length });
}

export async function POST(req: NextRequest) {
  const config = await getSiteConfig();

  if (!config.commentsEnabled) {
    return NextResponse.json({ error: "Comments are disabled" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const session = await getServerSession(authOptions);
  const { content, articleId, parentId, authorName, authorEmail } = parsed.data;

  // Reject anonymous comments if disabled and user is not signed in
  if (!session?.user && !config.anonymousCommentsEnabled) {
    return NextResponse.json({ error: "You must be signed in to comment" }, { status: 403 });
  }

  // Verify article exists and is published
  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article || article.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  const isPrivileged =
    session?.user?.role === "ADMIN" || session?.user?.role === "EDITOR";

  const comment = await prisma.comment.create({
    data: {
      content,
      articleId,
      parentId: parentId || null,
      authorId: session?.user?.id || null,
      authorName: session ? undefined : (authorName || "Anonymous"),
      authorEmail: session ? undefined : (authorEmail || null),
      isApproved: isPrivileged || !config.commentsRequireApproval,
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
