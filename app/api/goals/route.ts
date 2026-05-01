import { NextResponse } from "next/server";
import { setGoal, setSyncStateValue } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json();
  if (body.kind === "goal") {
    setGoal(
      Number(body.year),
      String(body.sport),
      body.distance_m == null ? null : Number(body.distance_m),
      body.time_s == null ? null : Number(body.time_s)
    );
  } else if (body.kind === "max_hr") {
    setSyncStateValue("max_hr_override", String(body.value));
  }
  return NextResponse.json({ ok: true });
}
