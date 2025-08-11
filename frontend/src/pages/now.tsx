// pages/now.tsx
import React, { useMemo, useState, useCallback } from "react";
import type { Task } from "../types/task";
import { useTasks } from "@/store/useTasks";
import TaskInput from "../components/TaskInput";
import Celebration from "@/components/effects/Celebration";

const Now = () => {
  const { tasks, setTasks, points, setPoints } = useTasks();

  // --- TaskInput 用 ---
  const [showInput, setShowInput] = useState(false);
  const [parentId, setParentId] = useState<string>("");
  const [input, setInput] = useState<string>("");
  const [deadline, setDeadline] = useState<string>("");
  const [celebrate, setCelebrate] = useState(false);

  // 参照マップ
  const taskMap = useMemo(() => {
    const m = new Map<string, Task>();
    for (const t of tasks) m.set(t.id, t);
    return m;
  }, [tasks]);

  // 親→子
  const childrenMap = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.parentId) continue;
      const arr = map.get(t.parentId) ?? [];
      arr.push(t);
      map.set(t.parentId, arr);
    }
    return map;
  }, [tasks]);

  // 子孫に未完がいるか？
  const hasOpenDescendant = useCallback(
    (id: string): boolean => {
      const stack = [...(childrenMap.get(id) ?? [])];
      while (stack.length) {
        const cur = stack.pop()!;
        if (!cur.completed) return true;
        const kids = childrenMap.get(cur.id);
        if (kids) stack.push(...kids);
      }
      return false;
    },
    [childrenMap]
  );

  // 実行可能
  const actionable = useMemo(
    () =>
      tasks
        .filter((t) => !t.completed && !hasOpenDescendant(t.id))
        .sort((a, b) => {
          const ta = a.deadline ? new Date(a.deadline).getTime() : Infinity;
          const tb = b.deadline ? new Date(b.deadline).getTime() : Infinity;
          return ta - tb;
        }),
    [tasks, hasOpenDescendant] // ← 依存を修正
  );

  // 親ごとにグループ化（メイン風のまとまり）
  const groups = useMemo(() => {
    type Group = { parent: Task | null; items: Task[]; key: string };
    const map = new Map<string, Group>();
    for (const c of actionable) {
      const p = c.parentId ? taskMap.get(c.parentId) ?? null : null;
      const key = p ? p.id : "__root__";
      const g = map.get(key) ?? { parent: p, items: [], key };
      g.items.push(c);
      map.set(key, g);
    }
    // 並び順：親の期限 or 子の最短期限→タイトル
    // itemsから最も早い期限(ミリ秒)を返す。なければ +∞
    const earliestMs = (items: { deadline?: string | null }[]): number => {
      if (!items?.length) return Number.POSITIVE_INFINITY;
      return Math.min(
        ...items.map((t) =>
          t.deadline ? new Date(t.deadline).getTime() : Number.POSITIVE_INFINITY
        )
      );
    };

    return Array.from(map.values()).sort((A, B) => {
      const aDeadline = earliestMs(A.items);
      const bDeadline = earliestMs(B.items);
      if (aDeadline !== bDeadline) return aDeadline - bDeadline;

      const at = A.parent ? A.parent.title : "(親なし)";
      const bt = B.parent ? B.parent.title : "(親なし)";
      return at.localeCompare(bt);
    });
  }, [actionable, taskMap]);

  const toggleTask = (id: string) => {
    const target = taskMap.get(id);
    if (!target) return;
    if (!target.completed && hasOpenDescendant(id)) {
      alert("未完了の子タスクがあるため、完了にできません。");
      return;
    }
    const willComplete = !target.completed;

    setPoints((p) => (willComplete ? p + 1 : Math.max(0, p - 1)));
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              completed: willComplete,
              completedAt: willComplete ? new Date().toISOString() : undefined,
            }
          : t
      )
    );

    if (willComplete) setCelebrate(true); // ← 完了時のみ発火
  };

  // TaskInput で追加
  const addTask = () => {
    if (!input.trim()) return;
    const newTask: Task = {
      id: crypto.randomUUID().slice(0, 6),
      title: input.trim(),
      completed: false,
      children: [],
      deadline: deadline || undefined,
      parentId: parentId || undefined,
    };
    setTasks((prev) => [newTask, ...prev]);
    setInput("");
    setDeadline("");
    setParentId("");
    setShowInput(false);
  };

  const openChildInput = (pid: string) => {
    setParentId(pid);
    setInput("");
    setDeadline("");
    setShowInput(true);
  };

  return (
    <div className="flex w-full h-screen">
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="mb-4 text-sm text-gray-600">
          <span className="font-semibold">{actionable.length}</span>{" "}
          件の「今すぐ実行」 ／ <span className="font-semibold">{points}</span>{" "}
          pt
        </div>

        <div className="space-y-4">
          {groups.map((g) => (
            <section
              key={g.key}
              className="rounded-2xl border border-gray-200 shadow-sm"
            >
              {/* 親ヘッダ（メイン風）：親タイトル＋小さな＋ */}
              <div className="px-4 py-2 flex items-center gap-2 text-sm text-gray-600 border-b">
                <span className="truncate">
                  {g.parent ? g.parent.title : "（親なし）"}
                </span>
                {g.parent && (
                  <button
                    onClick={() => openChildInput(g.parent!.id)} // ← ここだけ !
                    className="ml-1 px-2 py-0.5 rounded-full border text-xs hover:bg-gray-50"
                    title="親の子タスクを追加"
                  >
                    親に子タスク
                  </button>
                )}
              </div>

              {/* 子リスト（最下層だけ） */}
              <ul className="p-3 space-y-2">
                {g.items.map((t) => (
                  <li key={t.id} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5"
                      checked={!!t.completed}
                      onChange={() => toggleTask(t.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{t.title}</div>
                        <button
                          onClick={() => openChildInput(t.id)}
                          className="px-2 py-0.5 rounded-full border text-xs hover:bg-gray-50"
                          title="このタスクを分割（子を追加）"
                        >
                          ＋
                        </button>
                      </div>
                      {t.deadline && (
                        <div className="text-xs text-gray-500">
                          期限: {new Date(t.deadline).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {groups.length === 0 && (
          <div className="text-sm text-gray-500 mt-8">
            実行可能なタスクはありません。上位タスクを分割してみてください。
          </div>
        )}
      </div>

      {showInput && (
        <TaskInput
          input={input}
          setInput={setInput}
          setDeadline={setDeadline}
          addTask={addTask}
          setShowInput={setShowInput}
          parentId={parentId}
          setParentId={setParentId}
          deadline={deadline ?? ""}
          id=""
          onSubmit={addTask}
          submitLabel="追加"
        />
      )}
      <Celebration open={celebrate} onDone={() => setCelebrate(false)} />
    </div>
  );
};

export default Now;
