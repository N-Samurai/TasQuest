import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import { useTasks } from "@/store/useTasks";
import Sidebar from "@/components/Sidebar";

export default function MyApp({ Component, pageProps }: AppProps) {
  const { tasks, points, setTasks, setPoints } = useTasks();
  // src/pages/_app.tsx など、最初に走る所で
  useEffect(() => {
    window.api.loadTasks().then((d) => {
      console.log("★ Electron preload から届いたデータ", d); // ← 追加
    });
  }, []);

  // 起動時にファイルからロード
  useEffect(() => {
    window.api.loadTasks().then(({ tasks, points }) => {
      setTasks(tasks ?? []);
      setPoints(points ?? 0);
    });
  }, [setTasks, setPoints]);

  // 変更があったら保存
  useEffect(() => {
    window.api.saveTasks({ tasks, points });
  }, [tasks, points]);

  return (
    <div className="flex min-h-screen">
      <Sidebar /> {/* ← ここだけ修正 */}
      <main className="flex-1 p-4">
        <Component {...pageProps} />
      </main>
    </div>
  );
}
