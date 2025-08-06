import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Sidebar from "@/components/Sidebar"; // ← パスエイリアス @ を使わないなら "../components/Sidebar"
import { useRouter } from "next/router";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // サイドバーの「新規タスク」→ タスク一覧へ遷移しつつ、クエリで「新規入力を開く」合図を渡す
  const handleNewTask = () => {
    router.push({ pathname: "/", query: { new: "1" } });
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar onNewTask={handleNewTask} />
      <main className="flex-1 p-4 overflow-auto">
        <Component {...pageProps} />
      </main>
    </div>
  );
}
