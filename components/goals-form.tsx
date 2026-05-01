"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GoalForm({
  year,
  sport,
  initialDistanceKm,
}: {
  year: number;
  sport: string;
  initialDistanceKm: number | null;
}) {
  const router = useRouter();
  const [km, setKm] = useState(initialDistanceKm?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch("/api/goals", {
      method: "POST",
      body: JSON.stringify({
        kind: "goal",
        year,
        sport,
        distance_m: km ? Number(km) * 1000 : null,
        time_s: null,
      }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={km}
        onChange={(e) => setKm(e.target.value)}
        placeholder="km"
        className="w-24 rounded-md border border-bg-border bg-bg px-2 py-1 text-sm"
      />
      <button
        onClick={save}
        disabled={saving}
        className="rounded-md border border-bg-border bg-bg-card px-3 py-1 text-sm hover:border-strava disabled:opacity-50"
      >
        {saving ? "..." : "Save"}
      </button>
    </div>
  );
}

export function MaxHrForm({ initial }: { initial: number | null }) {
  const router = useRouter();
  const [v, setV] = useState(initial?.toString() ?? "");
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder="bpm"
        className="w-24 rounded-md border border-bg-border bg-bg px-2 py-1 text-sm"
      />
      <button
        onClick={async () => {
          await fetch("/api/goals", {
            method: "POST",
            body: JSON.stringify({ kind: "max_hr", value: v }),
          });
          router.refresh();
        }}
        className="rounded-md border border-bg-border bg-bg-card px-3 py-1 text-sm hover:border-strava"
      >
        Save
      </button>
    </div>
  );
}
