// types/goal.ts
export type Milestone = {
  id: string;
  title: string; // 例: "500点", "模試を3回やる" など自由記述
  value?: number; // 例: 500, 600（数値で進捗率を出したいときに任意で）
  completed: boolean;
  completedAt?: string;
};

export type Goal = {
  id: string;
  title: string; // 例: "TOEIC 900点"
  unit?: string; // 例: "点", "%", "kg"
  target?: number; // 例: 900（数値ターゲットがある場合）
  deadline?: string;
  milestones: Milestone[];
  completed: boolean;
  createdAt: string;
};
