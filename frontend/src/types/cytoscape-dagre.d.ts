/* eslint-disable @typescript-eslint/no-explicit-any */
// このファイルは「型が無い npm モジュールを any で扱う」ためだけの宣言です。

declare module "cytoscape-dagre" {
  const dagre: any; // ← ここを strict に書きたい場合は自作してください
  export default dagre; // ESM import 用
  export = dagre; // CommonJS require 用（保険）
}
