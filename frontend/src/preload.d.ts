// src/preload.d.ts
import type { Task } from "./src/types/task";

declare global {
  interface Window {
    api: {
      loadTasks: () => Promise<{ tasks: Task[]; points: number }>;
      saveTasks: (data: { tasks: Task[]; points: number }) => void;
    };
  }
}

export {}; // ← これがないと無視されることがあります
