import { NextResponse } from "next/server";
import { syncActivities } from "@/lib/sync";
import { getActivityCount } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST() {
  const initial = getActivityCount() === 0;
  const result = await syncActivities({ initial });
  return NextResponse.json(result);
}
