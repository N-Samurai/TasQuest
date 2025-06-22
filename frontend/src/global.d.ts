import type { Task } from "./types/task";

declare global {
  interface Window {
    api: {
      loadTasks: () => Promise<Task[]>;
      saveTasks: (tasks: Task[]) => void;
    };
  }
}

export {};
