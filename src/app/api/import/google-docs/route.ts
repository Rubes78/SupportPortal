import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getGoogleDocsClient, extractDocIdFromUrl } from "@/lib/google-docs/client";
import { convertGoogleDocToHtml } from "@/lib/google-docs/converter";
import { sanitizeHtml } from "@/lib/sanitize";
import { z } from "zod";

const schema = z.object({
  url: z.string().url(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["EDITOR", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const docId = extractDocIdFromUrl(parsed.data.url);
  if (!docId) {
    return NextResponse.json({ error: "Invalid Google Docs URL" }, { status: 400 });
  }

  try {
    const docs = await getGoogleDocsClient();
    const response = await docs.documents.get({ documentId: docId });
    const doc = response.data;

    const html = convertGoogleDocToHtml(doc);
    const sanitized = sanitizeHtml(html);

    return NextResponse.json({
      title: doc.title || "Imported Document",
      content: sanitized,
    });
  } catch (err: any) {
    const message = err?.message || "Failed to fetch Google Doc";
    if (message.includes("not found") || message.includes("404")) {
      return NextResponse.json(
        { error: "Document not found. Make sure it is shared with the service account." },
        { status: 404 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
