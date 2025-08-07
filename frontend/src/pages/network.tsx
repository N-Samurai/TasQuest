"use client";

import { useMemo, useRef, useEffect, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import cytoscape, {
  Core,
  ElementDefinition,
  LayoutOptions,
  EventObject,
} from "cytoscape";
import dagre from "cytoscape-dagre";
import { useTasks } from "@/store/useTasks";

cytoscape.use(dagre); // プラグイン登録

/* --- 型付き dynamic import (any 不使用) ---------------------- */
type CytoscapeProps = {
  cy?: (cy: Core) => void;
  elements: ElementDefinition[];
  layout: LayoutOptions;
  stylesheet: unknown;
  style?: CSSProperties;
  minZoom?: number;
  maxZoom?: number;
  panningEnabled?: boolean;
  zoomingEnabled?: boolean;
  boxSelectionEnabled?: boolean;
};

const CytoscapeComponent = dynamic(
  async () => {
    const mod = await import("react-cytoscapejs");
    return mod as unknown as { default: React.ComponentType<CytoscapeProps> };
  },
  { ssr: false }
) as React.ComponentType<CytoscapeProps>;

/* --- dagre レイアウト ---------------------------------------- */
const layout = {
  name: "dagre",
  rankDir: "TB",
  nodeSep: 40,
  rankSep: 80,
  padding: 30,
} as unknown as LayoutOptions;

/* --------- スタイル ------------------------------------------- */
const stylesheet = [
  {
    selector: "node",
    style: {
      label: "data(label)",
      "text-opacity": 0,
      "text-valign": "center",
      "text-halign": "center",
      "background-color": "#60a5fa",
      color: "#fff",
      "text-outline-color": "#000",
      "text-outline-width": 1,
      width: 42,
      height: 42,
      "transition-property": "text-opacity width height",
      "transition-duration": "200ms",
    },
  },
  {
    selector: 'node[completed = "true"]',
    style: { "background-color": "#22c55e" },
  },
  {
    selector: "node.hover",
    style: { "text-opacity": 1, width: 50, height: 50 },
  },
  {
    selector: "edge",
    style: {
      width: 2,
      "line-color": "#9ca3af",
      "target-arrow-color": "#9ca3af",
      "target-arrow-shape": "triangle",
      "curve-style": "bezier",
    },
  },
];

/* --------- ページ -------------------------------------------- */
export default function NetworkPage() {
  const tasks = useTasks((s) => s.tasks);

  const elements: ElementDefinition[] = useMemo(() => {
    const nodes = tasks.map((t) => ({
      data: {
        id: t.id,
        label: t.title,
        completed: t.completed ? "true" : "false",
      },
    }));
    const edges = tasks
      .filter((t) => t.parentId)
      .map((t) => ({
        data: {
          id: `${t.parentId}-${t.id}`,
          source: t.parentId!,
          target: t.id,
        },
      }));
    return [...nodes, ...edges];
  }, [tasks]);

  const cyRef = useRef<Core | null>(null);

  /* hover クラス制御 + 再レイアウト */
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    const enter = (e: EventObject) => e.target.addClass("hover");
    const leave = (e: EventObject) => e.target.removeClass("hover");
    cy.on("mouseover", "node", enter);
    cy.on("mouseout", "node", leave);

    cy.json({ elements });
    cy.layout(layout).run();

    return () => {
      cy.off("mouseover", "node", enter);
      cy.off("mouseout", "node", leave);
    };
  }, [elements]);

  return (
    <div className="h-[calc(100vh-64px)] overflow-auto p-6 bg-[#0e172a]">
      <div className="mx-auto max-w-6xl rounded-2xl shadow-lg ring-1 ring-gray-700/60">
        <CytoscapeComponent
          cy={(cy) => (cyRef.current = cy)}
          elements={[]} /* 初回は空で OK */
          layout={layout}
          stylesheet={stylesheet}
          style={{
            width: "100%",
            height: "600px",
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
