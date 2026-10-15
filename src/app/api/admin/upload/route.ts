import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { put } from "@vercel/blob";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Vercel serverless functions reject request bodies over 4.5 MB, so stay below it.
const MAX_BYTES = 4 * 1024 * 1024;

const MIME_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

export async function POST(request: NextRequest) {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  const admin = await verifyAdminSession(token);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "That image is too large to upload. Please use one under 4 MB." },
      { status: 413 }
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose an image to upload." }, { status: 422 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be 4 MB or smaller." }, { status: 422 });
  }

  const extension = MIME_EXTENSION[file.type];
  if (!extension) {
    return NextResponse.json(
      { error: "Use a JPG, PNG, WEBP, GIF, or SVG image." },
      { status: 422 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const folder = searchParams.get("folder")?.trim() || "pitches";
    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || "pitches";

    const blob = await put(
      `${safeFolder}/${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`,
      file,
      {
        access: "public",
        contentType: file.type,
        addRandomSuffix: false,
      }
    );
    return NextResponse.json({ url: blob.url }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not save the image." }, { status: 500 });
  }
}
