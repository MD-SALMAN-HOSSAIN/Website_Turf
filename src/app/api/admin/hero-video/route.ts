import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { mkdir, stat, unlink, writeFile } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 200 * 1024 * 1024;

const MIME_EXTENSION: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/ogg": "ogg",
};

async function getAdminSession() {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSession(token);
}

function localHeroFile(url: string | null): string | null {
  if (!url || !url.startsWith("/uploads/hero/")) return null;
  const filename = path.basename(url);
  return path.join(process.cwd(), "public", "uploads", "hero", filename);
}

async function deleteFileIfExists(filePath: string | null) {
  if (!filePath) return;
  try {
    await stat(filePath);
    await unlink(filePath);
  } catch {
    // file already gone - nothing to clean up
  }
}

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const config = await db.siteConfig.findUnique({ where: { id: "singleton" } });
  return NextResponse.json({ url: config?.heroVideoUrl ?? null });
}

export async function POST(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const remove = ["true", "1", "on"].includes(formData.get("remove")?.toString() ?? "");
  const current = await db.siteConfig.findUnique({ where: { id: "singleton" } });
  const previousUrl = current?.heroVideoUrl ?? null;

  if (remove) {
    try {
      await db.siteConfig.upsert({
        where: { id: "singleton" },
        update: { heroVideoUrl: null },
        create: { id: "singleton" },
      });
      await deleteFileIfExists(localHeroFile(previousUrl));
      return NextResponse.json({ url: null });
    } catch {
      return NextResponse.json({ error: "Could not remove the video." }, { status: 500 });
    }
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose a video to upload." }, { status: 422 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Video must be 200 MB or smaller." }, { status: 422 });
  }

  const extension = MIME_EXTENSION[file.type];
  if (!extension) {
    return NextResponse.json(
      { error: "Use a standard MP4, WEBM, or OGG video." },
      { status: 422 }
    );
  }

  try {
    const dir = path.join(process.cwd(), "public", "uploads", "hero");
    await mkdir(dir, { recursive: true });
    const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, filename), buffer);
    const url = `/uploads/hero/${filename}`;

    await db.siteConfig.upsert({
      where: { id: "singleton" },
      update: { heroVideoUrl: url },
      create: { id: "singleton", heroVideoUrl: url },
    });

    // The new video is live now - remove the replaced file and its record.
    if (previousUrl !== url) {
      await deleteFileIfExists(localHeroFile(previousUrl));
    }

    return NextResponse.json({ url }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not save the video." }, { status: 500 });
  }
}