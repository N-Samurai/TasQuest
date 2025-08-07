import type { Task } from "./types/task";
/* 型が無い npm モジュールを any で宣言するだけ */
declare module "cytoscape-dagre";
declare global {
  interface Window {
    api: {
      loadTasks: () => Promise<Task[]>;
      saveTasks: (tasks: Task[]) => void;
    };
  }
}

export {};
