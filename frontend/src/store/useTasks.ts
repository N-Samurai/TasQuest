// src/store/useTasks.ts
import { create } from "zustand";
import { Task } from "../types/task";

export const useTasks = create<{
  tasks: Task[];
  points: number;
  setTasks: (updater: Task[] | ((p: Task[]) => Task[])) => void;
  setPoints: (updater: number | ((n: number) => number)) => void;
}>((set) => ({
  tasks: [], // ← ★ ここが [] であることを確認
  points: 0,
  setTasks: (upd) =>
    set((state) => ({
      tasks: typeof upd === "function" ? upd(state.tasks) : upd,
    })),
  setPoints: (upd) =>
    set((state) => ({
      points: typeof upd === "function" ? upd(state.points) : upd,
    })),
}));
