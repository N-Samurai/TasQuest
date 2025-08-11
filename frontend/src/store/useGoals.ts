// src/store/useGoals.ts
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Milestone = {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
};

export type Goal = {
  id: string;
  title: string;
  milestones: Milestone[];
  completed: boolean;
  createdAt: string;
};

type GoalsState = {
  goals: Goal[];
  setGoals: (updater: (prev: Goal[]) => Goal[]) => void;
  resetGoals: () => void;
};

export const useGoals = create<GoalsState>()(
  persist(
    (set, get) => ({
      goals: [],
      setGoals: (updater) => set({ goals: updater(get().goals) }),
      resetGoals: () => set({ goals: [] }),
    }),
    {
      name: "tasquest-goals", // localStorage のキー
      version: 1,
      storage: createJSONStorage(() =>
        // SSRでも落ちないように安全なフォールバックを用意
        typeof window !== "undefined"
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
      ),
      // 必要なら保存対象を絞る
      // partialize: (state) => ({ goals: state.goals }),
      // 将来スキーマ変更したらここで移行
      // migrate: (state, v) => state,
    }
  )
);
