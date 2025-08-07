// pages/_app.tsx
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { useTasks } from "@/store/useTasks";

export default function MyApp({ Component, pageProps }: AppProps) {
  const { tasks, points, setTasks, setPoints } = useTasks();

  // 起動時 : ファイルから一括ロード
  useEffect(() => {
    window.api.loadTasks().then(({ tasks, points }) => {
      setTasks(tasks ?? []);
      setPoints(points ?? 0);
    });
  }, []);

  // tasks / points が変わるたび保存
  useEffect(() => {
    window.api.saveTasks({ tasks, points });
  }, [tasks, points]);

  return (
    <div className="flex min-h-screen">
      <Sidebar onNewTask={() => null} />
      <main className="flex-1 p-4">
        <Component {...pageProps} />
      </main>
    </div>
  );
}
