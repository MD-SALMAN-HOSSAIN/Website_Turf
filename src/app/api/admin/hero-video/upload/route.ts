import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 200 * 1024 * 1024;

const ALLOWED_CONTENT_TYPES = ["video/mp4", "video/webm", "video/ogg"];

export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody;

  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  const admin = await verifyAdminSession(token);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ALLOWED_CONTENT_TYPES,
        maximumSizeInBytes: MAX_BYTES,
        addRandomSuffix: true,
      }),
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not start the upload." },
      { status: 400 }
    );
  }
}
