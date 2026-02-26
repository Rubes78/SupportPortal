import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { sanitizeHtml } from "@/lib/sanitize";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["EDITOR", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!file.name.endsWith(".docx")) {
      return NextResponse.json({ error: "Only .docx files are supported" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Dynamic import to avoid SSR issues
    const mammoth = await import("mammoth");
    const result = await mammoth.convertToHtml(
      { buffer },
      {
        convertImage: mammoth.images.imgElement(async (image) => {
          const imageBuffer = await image.read("base64");
          return {
            src: `data:${image.contentType};base64,${imageBuffer}`,
          };
        }),
      }
    );

    const sanitized = sanitizeHtml(result.value);

    // Extract plain title from first heading if available
    let title = file.name.replace(/\.docx$/i, "");
    const h1Match = result.value.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (h1Match) {
      title = h1Match[1].replace(/<[^>]+>/g, "").trim();
    }

    return NextResponse.json({
      title,
      content: sanitized,
      messages: result.messages,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Conversion failed" }, { status: 500 });
  }
}
