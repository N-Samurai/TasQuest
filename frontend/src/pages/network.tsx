// pages/network.tsx
"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useTasks } from "@/store/useTasks";
import { useGoals } from "@/store/useGoals";
import type {
  ForceGraphMethods,
  NodeObject,
  LinkObject,
} from "react-force-graph-2d";
import type {
  ForceManyBody as D3ForceManyBody,
  ForceLink as D3ForceLink,
  SimulationNodeDatum,
  SimulationLinkDatum,
} from "d3-force";

// ---- d3-force の型（ジェネリクス必須なので薄い型を用意）
type SimNode = SimulationNodeDatum & { id?: string | number };
type SimLink = SimulationLinkDatum<SimNode> & { kind?: string };

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

// === Graph types（描画データ）===
type GraphNode = NodeObject & {
  id: string; // 必須
  label?: string;
  type: "task" | "goal";
  completed?: boolean;
};

type GraphLink = LinkObject & {
  source: string | GraphNode; // 文字列 or ノード
  target: string | GraphNode;
  kind: "taskEdge" | "goalEdge";
};

export default function NetworkPage() {
  const tasks = useTasks((s) => s.tasks);
  const goals = useGoals((s) => s.goals);

  // ---- グラフデータ構築 ----
  const data = useMemo<{ nodes: GraphNode[]; links: GraphLink[] }>(() => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    const taskIds = new Set(tasks.map((t) => t.id));
    const goalIds = new Set(goals.map((g) => g.id));

    for (const g of goals)
      nodes.push({
        id: g.id,
        label: g.title,
        type: "goal",
        completed: !!g.completed,
      });
    for (const t of tasks)
      nodes.push({
        id: t.id,
        label: t.title,
        type: "task",
        completed: !!t.completed,
      });

    for (const t of tasks) {
      if (!t.parentId) continue;
      if (taskIds.has(t.parentId))
        links.push({ source: t.parentId, target: t.id, kind: "taskEdge" });
      else if (goalIds.has(t.parentId))
        links.push({ source: t.parentId, target: t.id, kind: "goalEdge" });
    }
    return { nodes, links };
  }, [tasks, goals]);

  // ---- コンテナのサイズ観測（SSR安全） ----
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const r = entry.contentRect;
      setSize({ w: Math.max(100, r.width), h: Math.max(200, r.height) });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  // ---- ForceGraph API ----
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined);

  // 物理パラメータ（Obsidian 風）を適用
  // 物理パラメータ（Obsidian 風）を適用
  useEffect(() => {
    const api = fgRef.current as
      | (ForceGraphMethods & {
          d3Force?: (name: string) => unknown;
          d3ReheatSimulation?: () => void;
        })
      | undefined;

    // ref が未準備 or d3Force が無いなら何もしない（エラー回避）
    if (!api || typeof (api as { d3Force?: unknown }).d3Force !== "function") {
      // console.warn("force-graph ref not ready; skip custom forces");
      return;
    }

    const charge = api.d3Force!("charge") as
      | D3ForceManyBody<SimNode>
      | undefined;
    charge?.strength(-2600);

    const link = api.d3Force!("link") as
      | D3ForceLink<SimNode, SimLink>
      | undefined;
    link
      ?.distance((l) => ((l as SimLink).kind === "goalEdge" ? 180 : 120))
      .strength(0.2);

    api.d3ReheatSimulation?.();
  }, [data.nodes.length, data.links.length, size.w, size.h]);

  // レイアウト後に fit
  const safeFit = () => fgRef.current?.zoomToFit?.(600, 40);
  useEffect(() => {
    const t = setTimeout(safeFit, 0);
    return () => clearTimeout(t);
  }, [data.nodes.length, data.links.length, size.w, size.h]);

  // ---- ノード描画（Task=丸 / Goal=角丸）----
  type PositionedNode = GraphNode & { x: number; y: number };

  const drawNode = (
    node: NodeObject,
    ctx: CanvasRenderingContext2D,
    scale: number
  ) => {
    const n = node as PositionedNode;
    const r = 12;
    const color =
      n.type === "goal" ? "#a78bfa" : n.completed ? "#22c55e" : "#60a5fa";
    ctx.fillStyle = color;

    if (n.type === "goal") {
      const w = 36,
        h = 22,
        x = n.x - w / 2,
        y = n.y - h / 2,
        rr = 6;
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + w, y, x + w, y + h, rr);
      ctx.arcTo(x + w, y + h, x, y + h, rr);
      ctx.arcTo(x, y + h, x, y, rr);
      ctx.arcTo(x, y, x + w, y, rr);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, 2 * Math.PI);
      ctx.fill();
    }

    const label = n.label ?? "";
    const fontSize = 12 / Math.sqrt(scale);
    if (scale < 4 && label) {
      ctx.font = `${fontSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = "rgba(255,255,255,.92)";
      ctx.fillText(label, n.x, n.y + (n.type === "goal" ? 14 : r + 6));
    }
  };

  const drawHitArea = (
    node: NodeObject,
    color: string,
    ctx: CanvasRenderingContext2D
  ) => {
    const n = node as PositionedNode;
    ctx.fillStyle = color;
    if (n.type === "goal") {
      const w = 36,
        h = 22;
      ctx.fillRect(n.x - w / 2, n.y - h / 2, w, h);
    } else {
      const r = 14;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  const handleNodeClick = (n: NodeObject) => {
    const p = n as Partial<PositionedNode>;
    if (typeof p.x === "number" && typeof p.y === "number") {
      fgRef.current?.centerAt?.(p.x, p.y, 600);
      fgRef.current?.zoom?.(1.6, 600);
    }
  };

  return (
    <div className="p-6 bg-[#0e172a] h-[calc(100vh-0px)]">
      <div
        ref={wrapRef}
        className="mx-auto max-w-[1400px] h-[calc(100vh-96px)] rounded-2xl ring-1 ring-gray-700/60 relative"
        style={{
          background:
            "radial-gradient(1200px 600px at 60% -10%, rgba(99,102,241,0.15), transparent 60%), #0b1220",
        }}
      >
        {/* legend + fit */}
        <div className="absolute right-4 top-4 flex items-center gap-3 text-xs text-gray-200 bg-black/30 px-2 py-1 rounded z-10">
          <span className="inline-flex items-center gap-1">
            <span
              className="w-3 h-3 rounded-full inline-block"
              style={{ background: "#60a5fa" }}
            />
            Task
          </span>
          <span className="inline-flex items-center gap-1">
            <span
              className="w-3 h-3 rounded inline-block"
              style={{ background: "#a78bfa" }}
            />
            Goal
          </span>
          <button
            onClick={safeFit}
            className="px-2 py-0.5 rounded border hover:bg-white/10"
          >
            Fit
          </button>
        </div>

        <ForceGraph2D
          ref={fgRef}
          width={size.w}
          height={size.h}
          graphData={data}
          backgroundColor="#0b1220"
          cooldownTime={15000}
          minZoom={0.2}
          maxZoom={3}
          linkColor={(l: LinkObject) => {
            const kind = (l as Partial<GraphLink>).kind;
            return kind === "goalEdge" ? "#a78bfa" : "#9ca3af";
          }}
          linkWidth={1.2}
          linkDirectionalArrowLength={6}
          linkDirectionalArrowRelPos={1}
          linkLineDash={(l: LinkObject) =>
            (l as Partial<GraphLink>).kind === "goalEdge" ? [5, 4] : null
          }
          nodeRelSize={6}
          enableNodeDrag
          nodeCanvasObject={drawNode}
          nodePointerAreaPaint={drawHitArea}
          onNodeClick={handleNodeClick}
        />
      </div>
    </div>
  );
}
