import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  assetPrefix: "./", // すべてのリンクを相対パスに
  trailingSlash: true, // out/ 以下にフォルダ＋index.html を作る
  images: { unoptimized: true }, // 画像最適化を使わない
};

export default nextConfig;
