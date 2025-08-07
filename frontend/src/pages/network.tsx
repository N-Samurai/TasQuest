"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import cytoscape from "cytoscape";
import { useTasks } from "@/store/useTasks";

/* ── React ラッパ（ブラウザ限定） ─────────────── */
const CytoscapeComponent = dynamic(() => import("react-cytoscapejs"), {
  ssr: false,
});

/* ── レイアウト：フォース指向 cose ─────────────── */
const layout: cytoscape.LayoutOptions = {
  name: "cose",
  idealEdgeLength: 120,
  nodeRepulsion: 4050,
  nodeOverlap: 20,
  gravity: 0.25,
  padding: 30,
  animate: false,
};

/* ── スタイル ──────────────────────────────── */
const stylesheet: cytoscape.Stylesheet[] = [
  {
    selector: "node",
    style: {
      label: "data(label)",
      "text-opacity": 0, // ふだんは隠す
      "text-valign": "center",
      "text-halign": "center",
      "background-color": "#60a5fa", // 未完：青
      "text-outline-color": "#000",
      "text-outline-width": 1,
      color: "#fff",
      width: 42,
      height: 42,
      "transition-property": "text-opacity width height",
      "transition-duration": "200ms",
    },
  },
  {
    selector: 'node[completed = "true"]',
    style: { "background-color": "#22c55e" }, // 完了：緑
  },
  {
    selector: "node:hover",
    style: { "text-opacity": 1, width: 50, height: 50 }, // ホバーで拡大＋ラベル
  },
  {
    selector: "edge",
    style: {
      width: 2,
      "line-color": "#9ca3af",
      "target-arrow-color": "#9ca3af",
      "target-arrow-shape": "triangle",
      "curve-style": "straight", // フォース系と相性が良い
    },
  },
];

/* ── ページコンポーネント ───────────────────── */
export default function NetworkPage() {
  const tasks = useTasks((s) => s.tasks);

  /* ノード・エッジ変換 */
  const elements = useMemo(() => {
    const nodes = tasks.map((t) => ({
      data: {
        id: t.id,
        label: t.title,
        completed: t.completed ? "true" : "false",
      },
    }));
    const edges = tasks
      .filter((t) => t.parentId)
      .map((t) => ({ data: { source: t.parentId!, target: t.id } }));
    return [...nodes, ...edges];
  }, [tasks]);

  return (
    /* 外側：スクロール可能な領域 */
    <div className="h-[calc(100vh-64px)] overflow-auto p-6 bg-[#0e172a]">
      {/* カード風の枠 */}
      <div className="mx-auto max-w-6xl rounded-2xl shadow-lg ring-1 ring-gray-700/60">
        <CytoscapeComponent
          elements={elements as any}
          layout={layout as any}
          stylesheet={stylesheet as any}
          style={{
            width: "100%",
            height: "600px", // 外側 div がスクロール
            borderRadius: "1rem",
            background:
              "linear-gradient(135deg,#0f172a 0%,#111827 50%,#0f172a 100%)",
          }}
          minZoom={0.2}
          maxZoom={2}
          panningEnabled
          zoomingEnabled
          boxSelectionEnabled={false}
        />
      </div>
    </div>
  );
}
