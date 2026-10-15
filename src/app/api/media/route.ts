import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const media = await db.media.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });
  return NextResponse.json({ media });
}