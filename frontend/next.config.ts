import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import type { NextConfig } from "next";

export default function (phase: string): NextConfig {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;
  const isExport = process.env.NEXT_EXPORT === "true";

  console.log("[next.config]", { phase, isDev, isExport });

  /* ── 開発 (next dev) ───────────────────── */
  if (isDev) {
    return {
      reactStrictMode: true,
      trailingSlash: false,
      images: { unoptimized: true },
      assetPrefix: undefined, // /_next
    };
  }

  /* ── 静的書き出し (next export) ─────────── */
  if (isExport) {
    return {
      output: "export",
      trailingSlash: false, // ← 必ず false
      assetPrefix: "./", // ← 必ず "./"
      images: { unoptimized: true },
      reactStrictMode: true,
    };
  }

  /* ── 通常 SSR ビルド (未使用ならそのまま) ─ */
  return {
    reactStrictMode: true,
    images: { unoptimized: true },
  };
}
