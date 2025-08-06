// frontend/next.config.ts
import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

module.exports = (phase: string): NextConfig => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;
  const isExport = process.env.NEXT_EXPORT === "true";

  // デバッグ表示（起動時に一度だけ出ます）
  console.log("[next.config]", {
    phase,
    isDev,
    NEXT_EXPORT: process.env.NEXT_EXPORT ?? "(unset)",
  });

  if (isDev) {
    // ★ 開発は必ず絶対パス（/_next）に固定
    return {
      reactStrictMode: true,
      images: { unoptimized: true },
      assetPrefix: undefined, // or "/"
      trailingSlash: false,
    };
  }

  if (isExport) {
    // ★ next export（Electron本番: file:// 読み）
    return {
      output: "export",
      trailingSlash: true,
      assetPrefix: "./",
      images: { unoptimized: true },
      reactStrictMode: true,
    };
  }

  // 通常の本番SSR（使わないならそのまま）
  return {
    reactStrictMode: true,
    images: { unoptimized: true },
  };
};
