import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

async function getGoogleAuth() {
  let keyJson: string | null | undefined = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || null;

  const config = await prisma.siteConfig.findUnique({
    where: { id: "default" },
    select: { googleServiceAccountKey: true },
  });

  if (config?.googleServiceAccountKey) {
    keyJson = config.googleServiceAccountKey;
  }

  if (!keyJson) {
    throw new Error("Google service account is not configured");
  }

  const credentials = JSON.parse(keyJson);

  return new google.auth.GoogleAuth({
    credentials,
    scopes: [
      "https://www.googleapis.com/auth/documents.readonly",
      "https://www.googleapis.com/auth/drive.readonly",
    ],
  });
}

export async function getGoogleDocsClient() {
  const auth = await getGoogleAuth();
  return google.docs({ version: "v1", auth });
}

export async function getGoogleDriveClient() {
  const auth = await getGoogleAuth();
  return google.drive({ version: "v3", auth });
}

export function extractDocIdFromUrl(url: string): string | null {
  const match = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export function extractFolderIdFromUrl(url: string): string | null {
  const match = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}
