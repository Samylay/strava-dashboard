import { NextResponse } from "next/server";
import { loadActivityDetail } from "@/lib/sync";
import { getActivityById, getSplits, getStreams } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "bad id" }, { status: 400 });
  const activity = getActivityById(id);
  if (!activity) return NextResponse.json({ error: "not found" }, { status: 404 });

  let streams = getStreams(id);
  let splits = getSplits(id);
  if (Object.keys(streams).length === 0 || splits.length === 0) {
    await loadActivityDetail(id);
    streams = getStreams(id);
    splits = getSplits(id);
  }
  return NextResponse.json({ activity, streams, splits });
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "bad id" }, { status: 400 });
  await loadActivityDetail(id);
  return NextResponse.json({ ok: true });
}
