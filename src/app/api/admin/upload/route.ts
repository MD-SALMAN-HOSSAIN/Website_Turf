import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;

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
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose an image to upload." }, { status: 422 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be 5 MB or smaller." }, { status: 422 });
  }

  const extension = MIME_EXTENSION[file.type];
  if (!extension) {
    return NextResponse.json(
      { error: "Use a JPG, PNG, WEBP, GIF, or SVG image." },
      { status: 422 }
    );
  }

  try {
    const dir = path.join(process.cwd(), "public", "uploads", "pitches");
    await mkdir(dir, { recursive: true });
    const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, filename), buffer);
    return NextResponse.json({ url: `/uploads/pitches/${filename}` }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not save the image." }, { status: 500 });
  }
}
