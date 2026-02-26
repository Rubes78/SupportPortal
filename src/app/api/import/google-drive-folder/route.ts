import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  getGoogleDriveClient,
  getGoogleDocsClient,
  extractFolderIdFromUrl,
} from "@/lib/google-docs/client";
import { convertGoogleDocToHtml } from "@/lib/google-docs/converter";
import { sanitizeHtml } from "@/lib/sanitize";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { z } from "zod";
import type { drive_v3 } from "googleapis";

const GDOC_MIME = "application/vnd.google-apps.document";
const FOLDER_MIME = "application/vnd.google-apps.folder";

interface DriveFile {
  id: string;
  name: string;
  folderPath: string[];
}

async function listFolderRecursive(
  drive: drive_v3.Drive,
  folderId: string,
  path: string[] = []
): Promise<DriveFile[]> {
  const results: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: "nextPageToken, files(id,name,mimeType)",
      pageSize: 200,
      pageToken,
    });

    for (const file of res.data.files || []) {
      if (!file.id || !file.name) continue;
      if (file.mimeType === GDOC_MIME) {
        results.push({ id: file.id, name: file.name, folderPath: path });
      } else if (file.mimeType === FOLDER_MIME) {
        const sub = await listFolderRecursive(drive, file.id, [...path, file.name]);
        results.push(...sub);
      }
    }

    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return results;
}

// GET /api/import/google-drive-folder?url=...
// Lists all Google Docs in a folder, with category suggestions based on subfolder names.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["EDITOR", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "url parameter required" }, { status: 400 });

  const folderId = extractFolderIdFromUrl(url);
  if (!folderId) {
    return NextResponse.json({ error: "Invalid Google Drive folder URL" }, { status: 400 });
  }

  try {
    const drive = await getGoogleDriveClient();

    const folderMeta = await drive.files.get({ fileId: folderId, fields: "id,name" });
    const files = await listFolderRecursive(drive, folderId);

    // Build a lowercase name → category map for matching subfolder names
    const categories = await prisma.category.findMany({ select: { id: true, name: true } });
    const categoryMap = new Map(categories.map((c) => [c.name.toLowerCase(), c]));

    const enriched = files.map((f) => {
      const subfolderName = f.folderPath[0];
      const matched = subfolderName ? categoryMap.get(subfolderName.toLowerCase()) : null;
      return {
        id: f.id,
        name: f.name,
        folderPath: f.folderPath,
        suggestedCategoryId: matched?.id ?? null,
        suggestedCategoryName: matched?.name ?? null,
      };
    });

    return NextResponse.json({
      folderId,
      folderName: folderMeta.data.name || "Folder",
      files: enriched,
    });
  } catch (err: any) {
    const msg = err?.message || "Failed to list folder";
    if (msg.includes("not found") || msg.includes("404")) {
      return NextResponse.json(
        { error: "Folder not found. Make sure it is shared with the service account." },
        { status: 404 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/import/google-drive-folder
// Fetches and creates articles for the selected documents.
const importSchema = z.object({
  items: z
    .array(
      z.object({
        fileId: z.string(),
        title: z.string().optional(),
        categoryId: z.string().nullable().optional(),
        status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
      })
    )
    .min(1)
    .max(50),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["EDITOR", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = importSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { items } = parsed.data;
  const docs = await getGoogleDocsClient();
  const authorId = session.user.id;
  const results = [];

  for (const item of items) {
    try {
      const response = await docs.documents.get({ documentId: item.fileId });
      const doc = response.data;
      const title = item.title || doc.title || "Imported Document";
      const content = sanitizeHtml(convertGoogleDocToHtml(doc));
      const excerpt = content.replace(/<[^>]+>/g, "").slice(0, 300) || null;

      let slug = slugify(title);
      const existing = await prisma.article.count({ where: { slug } });
      if (existing > 0) slug = `${slug}-${Date.now()}`;

      const article = await prisma.article.create({
        data: {
          title,
          slug,
          content,
          excerpt,
          status: item.status,
          authorId,
          categoryId: item.categoryId || null,
          publishedAt: item.status === "PUBLISHED" ? new Date() : null,
          versions: {
            create: {
              title,
              content,
              excerpt,
              authorId,
              versionNumber: 1,
              changeNote: "Imported from Google Drive folder",
            },
          },
        },
      });

      results.push({ fileId: item.fileId, title, success: true, articleId: article.id });
    } catch (err: any) {
      results.push({
        fileId: item.fileId,
        title: item.title || item.fileId,
        success: false,
        error: err?.message || "Import failed",
      });
    }
  }

  const succeeded = results.filter((r) => r.success).length;
  return NextResponse.json({
    results,
    summary: { total: items.length, succeeded, failed: items.length - succeeded },
  });
}
