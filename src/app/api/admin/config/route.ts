import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Role } from "@prisma/client";

const updateSchema = z.object({
  siteName: z.string().min(1).max(100).optional(),
  siteDescription: z.string().max(500).nullable().optional(),
  allowRegistration: z.boolean().optional(),
  defaultRole: z.nativeEnum(Role).optional(),
  commentsEnabled: z.boolean().optional(),
  commentsRequireApproval: z.boolean().optional(),
  anonymousCommentsEnabled: z.boolean().optional(),
  articlesPerPage: z.number().int().min(1).max(100).optional(),
  showAuthor: z.boolean().optional(),
  // null = clear the key, string = update it, absent = leave unchanged
  googleServiceAccountKey: z.string().min(10).nullable().optional(),
});

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") return null;
  return session.user;
}

function safeParseGoogleEmail(key: string | null): string | null {
  if (!key) return null;
  try {
    const parsed = JSON.parse(key);
    return parsed.client_email ?? null;
  } catch {
    return null;
  }
}

/** Strip the raw key — return everything except googleServiceAccountKey, plus a safe status field */
function safeConfig(config: Record<string, unknown>) {
  const { googleServiceAccountKey, ...rest } = config;
  return {
    ...rest,
    googleClientEmail: safeParseGoogleEmail(googleServiceAccountKey as string | null),
  };
}

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const config = await prisma.siteConfig.findUnique({ where: { id: "default" } });
  return NextResponse.json(safeConfig(config as Record<string, unknown>));
}

export async function PATCH(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Validate Google key JSON structure if a new one is being set
  if (parsed.data.googleServiceAccountKey) {
    try {
      const key = JSON.parse(parsed.data.googleServiceAccountKey);
      const required = ["type", "project_id", "private_key", "client_email"];
      const missing = required.filter((f) => !key[f]);
      if (missing.length > 0) {
        return NextResponse.json(
          { error: `Invalid service account JSON — missing fields: ${missing.join(", ")}` },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json({ error: "Invalid JSON — could not parse service account key" }, { status: 400 });
    }
  }

  const config = await prisma.siteConfig.upsert({
    where: { id: "default" },
    update: parsed.data,
    create: { id: "default", ...parsed.data },
  });

  return NextResponse.json(safeConfig(config as Record<string, unknown>));
}
