"use client";

import { useEffect, useState, useMemo } from "react";
import type { Task } from "@/types/task"; // ← パスは実際の配置に合わせて

declare global {
  interface Window {
    api: {
      loadTasks: () => Promise<{ tasks: Task[]; points: number }>;
      saveTasks: (data: { tasks: Task[]; points: number }) => void;
    };
  }
}

export default function LogsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [points, setPoints] = useState(0);

  // ------------- load ---------------------------------
  useEffect(() => {
    window.api.loadTasks().then(({ tasks, points }) => {
      setTasks(tasks);
      setPoints(points);
    });
  }, []);

  // ------------- completed list -----------------------
  const completed = useMemo(
    () =>
      tasks
        .filter((t) => t.completed && t.completedAt)
        .sort((a, b) =>
          (b.completedAt ?? "").localeCompare(a.completedAt ?? "")
        ),
    [tasks]
  );

  // ------------- revert -------------------------------
  const revert = (id: string) => {
    const next = tasks.map((t) =>
      t.id === id ? { ...t, completed: false, completedAt: undefined } : t
    );
    setTasks(next);
    window.api.saveTasks({ tasks: next, points });
  };

  // ------------- UI -----------------------------------
  return (
    <div className="mx-auto max-w-3xl p-4">
      <h1 className="text-2xl font-bold mb-4">完了タスク履歴</h1>

      {completed.length === 0 ? (
        <p className="text-gray-400">まだ完了タスクはありません。</p>
      ) : (
        <ul className="divide-y divide-gray-700/40">
          {completed.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between py-2 hover:bg-gray-800/40 rounded px-2"
            >
              <div className="flex flex-col">
                <span className="text-sm text-gray-400">
                  {new Date(t.completedAt!).toLocaleString("ja-JP", {
                    year: "2-digit",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="text-base">{t.title}</span>
              </div>

              <button
                onClick={() => revert(t.id)}
                className="text-xs px-3 py-1 rounded border border-gray-500 hover:bg-gray-700"
              >
                未完了に戻す
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
