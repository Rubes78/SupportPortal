import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  articleId: z.string(),
  isHelpful: z.boolean(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const articleId = searchParams.get("articleId");
  if (!articleId) return NextResponse.json({ error: "articleId required" }, { status: 400 });

  const session = await getServerSession(authOptions);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "unknown";

  const [helpful, notHelpful, userFeedback] = await Promise.all([
    prisma.articleFeedback.count({ where: { articleId, isHelpful: true } }),
    prisma.articleFeedback.count({ where: { articleId, isHelpful: false } }),
    session?.user?.id
      ? prisma.articleFeedback.findFirst({ where: { articleId, userId: session.user.id } })
      : prisma.articleFeedback.findFirst({ where: { articleId, ipAddress: ip } }),
  ]);

  return NextResponse.json({
    helpful,
    notHelpful,
    userVoted: userFeedback ? userFeedback.isHelpful : null,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { articleId, isHelpful } = parsed.data;
  const session = await getServerSession(authOptions);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "unknown";

  // Check for existing feedback
  const existing = session?.user?.id
    ? await prisma.articleFeedback.findFirst({ where: { articleId, userId: session.user.id } })
    : await prisma.articleFeedback.findFirst({ where: { articleId, ipAddress: ip } });

  if (existing) {
    // Update existing
    await prisma.articleFeedback.update({
      where: { id: existing.id },
      data: { isHelpful },
    });
  } else {
    await prisma.articleFeedback.create({
      data: {
        articleId,
        isHelpful,
        userId: session?.user?.id || null,
        ipAddress: session?.user?.id ? null : ip,
      },
    });
  }

  const [helpful, notHelpful] = await Promise.all([
    prisma.articleFeedback.count({ where: { articleId, isHelpful: true } }),
    prisma.articleFeedback.count({ where: { articleId, isHelpful: false } }),
  ]);

  return NextResponse.json({ helpful, notHelpful, userVoted: isHelpful });
}
