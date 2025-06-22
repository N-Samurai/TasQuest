/** @type {import('next').NextConfig} */
module.exports = {
  output: "export",
  // ↓ 追加ここから
  assetPrefix: "./", // すべてのリンクを相対パスに
  trailingSlash: true, // out/ 以下にフォルダ＋index.html を作る
  images: { unoptimized: true }, // 画像最適化を使わない
  // ↑ 追加ここまで
};
