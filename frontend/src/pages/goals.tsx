// pages/goals.tsx
import React, { useMemo, useState } from "react";
import { nanoid } from "nanoid";
import type { Goal, Milestone } from "@/types/goal";
import { useGoals } from "@/store/useGoals";
import { useTasks } from "@/store/useTasks";
import Celebration from "@/components/effects/Celebration";

// 進捗（件数ベース）
const progressOf = (g: Goal) => {
  const total = g.milestones.length;
  if (!total) return 0;
  const done = g.milestones.filter((m) => m.completed).length;
  return Math.round((done / total) * 100);
};

// 次に達成可能なマイルストーン（末尾から順番）
const nextActionableMsId = (g: Goal): string | null => {
  for (let i = g.milestones.length - 1; i >= 0; i--) {
    if (!g.milestones[i].completed) return g.milestones[i].id;
  }
  return null; // 全部完了
};

export default function GoalsPage() {
  const { goals, setGoals } = useGoals();
  const { setPoints } = useTasks();
  const [celebrate, setCelebrate] = useState(false);

  // 実績（Goal）追加欄
  const [goalTitle, setGoalTitle] = useState("");

  // 並び順：未達→新しい順
  const sorted = useMemo(
    () =>
      [...goals].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return +new Date(b.createdAt) - +new Date(a.createdAt);
      }),
    [goals]
  );

  // Goal 追加（Goal だけ増やす）
  const addGoal = () => {
    if (!goalTitle.trim()) return;
    const g: Goal = {
      id: nanoid(6),
      title: goalTitle.trim(),
      milestones: [],
      completed: false,
      createdAt: new Date().toISOString(),
    } as Goal;
    setGoals((prev) => [g, ...prev]);
    setGoalTitle("");
  };

  // Goal 完了トグル（全マイルストーン完了前は完了不可）
  const toggleGoal = (goalId: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        const allDone =
          g.milestones.length === 0 || g.milestones.every((m) => m.completed);
        if (!allDone) return g; // ガード：順序達成ルール
        const next = { ...g, completed: !g.completed };
        if (!g.completed && next.completed) setPoints((p) => p + 2);
        return next;
      })
    );
    setCelebrate(true);
  };

  // === 一次元ステップ用：＋は各 Goal にひとつ ===
  const [addingGoalId, setAddingGoalId] = useState<string | null>(null);
  const [msInputs, setMsInputs] = useState<Record<string, string>>({});
  const setMsInput = (goalId: string, v: string) =>
    setMsInputs((s) => ({ ...s, [goalId]: v }));

  const toggleMilestoneInput = (goalId: string) =>
    setAddingGoalId((prev) => (prev === goalId ? null : goalId));

  // 末尾に追加（例: 800 → 700 → 600 の順に“上から入力”して下へ並ぶ）
  const addMilestone = (goalId: string) => {
    const t = (msInputs[goalId] ?? "").trim();
    if (!t) return;
    const m: Milestone = {
      id: nanoid(6),
      title: t,
      completed: false,
    } as Milestone;
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId ? { ...g, milestones: [...g.milestones, m] } : g
      )
    );
    setMsInput(goalId, "");
    setAddingGoalId(null); // 追加後は閉じる
  };

  // Milestone 完了（末尾から順にしか完了できない） → 全部終われば Goal も完了
  const toggleMilestone = (goalId: string, msId: string) => {
    const g = goals.find((x) => x.id === goalId);
    if (!g) return;
    const allowed = nextActionableMsId(g);
    if (allowed && allowed !== msId) {
      const must =
        g.milestones.find((m) => m.id === allowed)?.title ?? "前のステップ";
      alert(`先に「${must}」を達成してください。`);
      return;
    }

    setGoals((prev) =>
      prev.map((gg) => {
        if (gg.id !== goalId) return gg;
        const milestones = gg.milestones.map((m) =>
          m.id === msId
            ? {
                ...m,
                completed: !m.completed,
                completedAt: !m.completed
                  ? new Date().toISOString()
                  : undefined,
              }
            : m
        );
        const allDone =
          milestones.length > 0 && milestones.every((m) => m.completed);
        return { ...gg, milestones, completed: allDone ? true : gg.completed };
      })
    );

    setPoints((p) => p + 1);
    setCelebrate(true);
  };

  // ===== 名前編集（Goal / Milestone） =====
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingGoalTitle, setEditingGoalTitle] = useState("");

  const startEditGoal = (g: Goal) => {
    setEditingGoalId(g.id);
    setEditingGoalTitle(g.title);
  };
  const saveEditGoal = () => {
    if (!editingGoalId) return;
    setGoals((prev) =>
      prev.map((g) =>
        g.id === editingGoalId
          ? { ...g, title: editingGoalTitle.trim() || g.title }
          : g
      )
    );
    setEditingGoalId(null);
    setEditingGoalTitle("");
  };
  const cancelEditGoal = () => {
    setEditingGoalId(null);
    setEditingGoalTitle("");
  };

  const [editingMs, setEditingMs] = useState<{
    goalId: string;
    msId: string;
  } | null>(null);
  const [editingMsTitle, setEditingMsTitle] = useState("");

  const startEditMs = (goalId: string, ms: Milestone) => {
    setEditingMs({ goalId, msId: ms.id });
    setEditingMsTitle(ms.title);
  };
  const saveEditMs = () => {
    if (!editingMs) return;
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== editingMs.goalId) return g;
        const milestones = g.milestones.map((m) =>
          m.id === editingMs.msId
            ? { ...m, title: editingMsTitle.trim() || m.title }
            : m
        );
        return { ...g, milestones };
      })
    );
    setEditingMs(null);
    setEditingMsTitle("");
  };
  const cancelEditMs = () => {
    setEditingMs(null);
    setEditingMsTitle("");
  };

  // ===== Goal ID コピー（Goal だけ） =====
  const [copied, setCopied] = useState<string | null>(null);
  const copyGoalId = async (goalId: string) => {
    try {
      await navigator.clipboard.writeText(goalId);
      setCopied(goalId);
      setTimeout(() => setCopied(null), 1200);
    } catch {
      // フォールバック
      const ta = document.createElement("textarea");
      ta.value = goalId;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(goalId);
      setTimeout(() => setCopied(null), 1200);
    }
  };

  return (
    <div className="flex w-full h-screen">
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* 実績追加（Goalのみ） */}
        <section className="rounded-2xl border border-gray-200 p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <input type="checkbox" className="h-5 w-5 opacity-40" disabled />
            <input
              className="flex-1 border rounded-lg px-3 py-2"
              placeholder="実績名（例: TOEIC 900点）"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addGoal()}
            />
            <button
              onClick={addGoal}
              className="px-3 py-1 rounded-lg border text-sm hover:bg-gray-50"
              title="この実績（Goal）を追加"
            >
              ＋
            </button>
          </div>
        </section>

        {/* 実績一覧 */}
        {sorted.map((g) => {
          const progress = progressOf(g);
          const actionableId = nextActionableMsId(g);
          const goalCanComplete =
            g.milestones.length === 0 || g.milestones.every((m) => m.completed);
          return (
            <section
              key={g.id}
              className="rounded-2xl border border-gray-200 shadow-sm p-3"
            >
              {/* Goal 行：チェック + タイトル(or 編集) + [IDコピー] + [編集] + [＋] */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="h-5 w-5"
                  checked={g.completed}
                  disabled={!goalCanComplete}
                  title={
                    goalCanComplete
                      ? "実績を完了"
                      : "全ステップを完了すると実績を完了できます"
                  }
                  onChange={() => toggleGoal(g.id)}
                />

                {/* タイトル or 編集入力 */}
                {editingGoalId === g.id ? (
                  <>
                    <input
                      className="flex-1 border rounded-lg px-3 py-2"
                      value={editingGoalTitle}
                      onChange={(e) => setEditingGoalTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveEditGoal()}
                    />
                    {/* IDコピー（編集中も表示） */}
                    <button
                      onClick={() => copyGoalId(g.id)}
                      className="px-2 py-0.5 rounded-lg border text-[11px] text-gray-600 hover:bg-gray-50 shrink-0"
                      title="IDをコピー"
                    >
                      #{g.id}
                    </button>
                    {copied === g.id && (
                      <span className="text-xs text-emerald-600">copied</span>
                    )}

                    <button
                      className="px-2 py-1 rounded-lg border text-sm hover:bg-gray-50"
                      onClick={saveEditGoal}
                    >
                      保存
                    </button>
                    <button
                      className="px-2 py-1 rounded-lg border text-sm hover:bg-gray-50"
                      onClick={cancelEditGoal}
                    >
                      ｷｬﾝｾﾙ
                    </button>
                  </>
                ) : (
                  <>
                    <div
                      className={`flex-1 font-medium ${
                        g.completed ? "line-through text-gray-400" : ""
                      }`}
                    >
                      {g.title}
                    </div>
                    {/* IDコピー（Goalだけ） */}
                    <button
                      onClick={() => copyGoalId(g.id)}
                      className="px-2 py-0.5 rounded-lg border text-[11px] text-gray-600 hover:bg-gray-50 shrink-0"
                      title="IDをコピー"
                    >
                      #{g.id}
                    </button>
                    {copied === g.id && (
                      <span className="text-xs text-emerald-600">copied</span>
                    )}
                  </>
                )}

                {/* 編集ボタン（非編集時のみ） */}
                {editingGoalId !== g.id && (
                  <button
                    className="px-2 py-1 rounded-lg border text-sm hover:bg-gray-50"
                    onClick={() => startEditGoal(g)}
                  >
                    編集
                  </button>
                )}

                {/* ＋：この Goal のマイルストーン入力欄を開く/閉じる（1つだけ） */}
                <button
                  onClick={() => toggleMilestoneInput(g.id)}
                  className="px-3 py-1 rounded-lg border text-sm hover:bg-gray-50"
                  title="この実績にマイルストーンを追加"
                >
                  ＋
                </button>
              </div>

              {/* 進捗バー（Goal ヘッダ直下） */}
              <div className="mt-2 px-1">
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${
                      progress >= 100 ? "bg-emerald-500" : "bg-blue-500"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                  進捗 {progress}%
                </div>
              </div>

              {/* マイルストーン入力欄（＋で開く） */}
              {addingGoalId === g.id && (
                <div className="mt-2 pl-8 flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-5 w-5 opacity-40"
                    disabled
                  />
                  <input
                    className="flex-1 border rounded-lg px-3 py-2"
                    placeholder="マイルストーン（例: 800点 → 次に 700点 → 600点）"
                    value={msInputs[g.id] ?? ""}
                    onChange={(e) => setMsInput(g.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addMilestone(g.id);
                    }}
                  />
                  <button
                    onClick={() => addMilestone(g.id)}
                    className="px-3 py-1 rounded-lg border text-sm hover:bg-gray-50"
                  >
                    追加
                  </button>
                  <button
                    onClick={() => setAddingGoalId(null)}
                    className="px-3 py-1 rounded-lg border text-sm hover:bg-gray-50"
                  >
                    閉じる
                  </button>
                </div>
              )}

              {/* マイルストーン一覧（末尾から順にしか完了できない） */}
              <ul className="mt-2 pl-8 space-y-2">
                {g.milestones.map((m) => {
                  const disabled = actionableId !== m.id && !m.completed; // 次の番以外は無効
                  return (
                    <li key={m.id} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className={`h-5 w-5 ${
                          disabled ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        checked={m.completed}
                        disabled={disabled}
                        onChange={() => toggleMilestone(g.id, m.id)}
                        title={
                          disabled
                            ? "下のステップから順に達成してください"
                            : "このステップを達成"
                        }
                      />
                      <div
                        className={`flex-1 ${
                          m.completed
                            ? "line-through text-gray-400"
                            : "font-medium"
                        }`}
                      >
                        {m.title}
                      </div>
                      {/* 編集 */}
                      {!(
                        editingMs &&
                        editingMs.goalId === g.id &&
                        editingMs.msId === m.id
                      ) ? (
                        <button
                          className="px-2 py-1 rounded-lg border text-sm hover:bg-gray-50"
                          onClick={() => startEditMs(g.id, m)}
                        >
                          編集
                        </button>
                      ) : (
                        <>
                          <input
                            className="flex-1 border rounded-lg px-3 py-2"
                            value={editingMsTitle}
                            onChange={(e) => setEditingMsTitle(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && saveEditMs()}
                          />
                          <button
                            className="px-2 py-1 rounded-lg border text-sm hover:bg-gray-50"
                            onClick={saveEditMs}
                          >
                            保存
                          </button>
                          <button
                            className="px-2 py-1 rounded-lg border text-sm hover:bg-gray-50"
                            onClick={cancelEditMs}
                          >
                            ｷｬﾝｾﾙ
                          </button>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <Celebration open={celebrate} onDone={() => setCelebrate(false)} />
    </div>
  );
}
