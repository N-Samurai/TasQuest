"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useTasks } from "@/store/useTasks";

// ── Recharts（SSR 無効で個別読み込み） ──────────────────────
const ResponsiveContainer = dynamic(
  () => import("recharts").then((m) => m.ResponsiveContainer),
  { ssr: false }
);
const AreaChart = dynamic(() => import("recharts").then((m) => m.AreaChart), {
  ssr: false,
});
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), {
  ssr: false,
});
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), {
  ssr: false,
});
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), {
  ssr: false,
});
const Area = dynamic(() => import("recharts").then((m) => m.Area), {
  ssr: false,
});
// ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const tasks = useTasks((s) => s.tasks);
  const [weekShift, setWeekShift] = useState(0); // 0=今週,1=先週…

  /* 週ラベル生成 ───────────── */
  const weekLabel = useMemo(() => {
    const end = new Date();
    end.setDate(end.getDate() - weekShift * 7);
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    return `${start.getMonth() + 1}/${start.getDate()}–${
      end.getMonth() + 1
    }/${end.getDate()}`;
  }, [weekShift]);

  /* 集計 ─────────────────── */
  const daily = useMemo(() => {
    const anchor = new Date();
    anchor.setHours(0, 0, 0, 0);
    anchor.setDate(anchor.getDate() - weekShift * 7); // 週オフセット

    const map: Record<string, number> = {};

    tasks.forEach((t) => {
      if (!t.completedAt) return;
      const done = new Date(t.completedAt);
      done.setHours(0, 0, 0, 0);

      const diffDays = Math.floor(
        (anchor.getTime() - done.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays >= 0 && diffDays < 7) {
        const key = done.toLocaleDateString("ja-JP", {
          month: "2-digit",
          day: "2-digit",
        });
        map[key] = (map[key] ?? 0) + 1;
      }
    });

    // 週を古い順で返す
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(anchor);
      d.setDate(anchor.getDate() - (6 - i));
      const key = d.toLocaleDateString("ja-JP", {
        month: "2-digit",
        day: "2-digit",
      });
      return { date: key, count: map[key] ?? 0 };
    });
  }, [tasks, weekShift]);

  /* UI ─────────────────────── */
  return (
    <div className="mx-auto max-w-4xl p-6 space-y-8">
      {/* ── 7日ラインチャート + 週送り ──────────── */}
      <section className="w-full h-80 rounded-lg bg-gray-900 p-4">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => setWeekShift((s) => s + 1)}
            className="px-2 py-0.5 rounded bg-gray-700 hover:bg-gray-600"
          >
            ←
          </button>
          <h2 className="text-lg font-semibold text-gray-200">{weekLabel}</h2>
          <button
            onClick={() => setWeekShift((s) => Math.max(0, s - 1))}
            className="px-2 py-0.5 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40"
            disabled={weekShift === 0}
          >
            →
          </button>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={daily}>
            <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 12 }} />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "#9ca3af", fontSize: 12 }}
            />
            <Tooltip
              formatter={(v: number) => [`${v} 件`, "完了"]}
              labelFormatter={(l) => `日付: ${l}`}
              contentStyle={{ background: "#1f2937", border: "none" }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#60a5fa"
              fill="#60a5fa33"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </section>

      {/* ── 下段：後で実装 ─────────────────── */}
      <section className="w-full h-64 rounded-lg border border-dashed border-gray-600 flex items-center justify-center text-gray-500">
        下段チャートは後で実装
      </section>
    </div>
  );
}
