import type { Task } from "../types/task";
import TaskInput from "../components/TaskInput";
import React, { ReactNode } from "react";

interface TaskItemProps extends Omit<Task, "children"> {
  // ★ 修正
  toggleTask: (id: string) => void;
  onDelete: (id: string) => void;
  setDeadline: (deadline: string) => void;
  level?: number;
  showInput: boolean;
  setShowInput: (show: boolean) => void;
  input: string;
  setInput: (input: string) => void;
  addtask: () => void;
  parentId?: string;
  setParentId: (parentId: string) => void;
  timelineRootId: string | null;
  setTimelineRootId: (id: string | null) => void;
  children?: ReactNode; // React 用 children
  setEditingId: (id: string | null) => void;
  toggleTimeline: (id: string) => void;
}

export default function TaskItem({
  id,
  title,
  completed,
  toggleTask,
  onDelete,
  deadline,
  setDeadline,
  level = 0,
  showInput,
  setShowInput,
  input,
  setInput,
  addtask,
  setParentId,
  parentId,
  timelineRootId,
  children,
  setEditingId,
  toggleTimeline,
}: TaskItemProps) {
  return (
    <li>
      <div style={{ marginLeft: `${level * 24}px` }}>
        <div className="flex items-center justify-between p-4 bg-white shadow rounded hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={completed}
              onChange={() => toggleTask(id)}
              className="w-5 h-5 accent-blue-500"
            />
            <div>
              <div
                className={`text-base ${
                  completed ? "line-through text-gray-400" : "text-gray-800"
                }`}
              >
                {title}
              </div>
              <div className="text-xs text-gray-400">{id}</div>
              <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded bg-red-100 text-red-600">
                {deadline}
              </span>
            </div>
          </div>

          <div className="flex gap-2 ml-4">
            <button
              onClick={() => toggleTimeline(id)}
              className={`px-3 py-1 text-sm rounded text-white
    ${
      timelineRootId === id
        ? "bg-green-500 hover:bg-green-600" // ← 現在ツリー表示に戻す状態
        : "bg-purple-500 hover:bg-purple-600" // ← タイムラインに切り替える状態
    }`}
            >
              {timelineRootId === id ? "ツリー表示" : "タイムライン"}
            </button>

            <button
              onClick={() => {
                setParentId(id);
                setInput("");
                setShowInput(true);
              }}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              追加
            </button>

            <button
              onClick={() => {
                setInput(title);
                setShowInput(true);
                setEditingId(id);
                setDeadline(deadline || "");
              }}
              className="px-3 py-1 text-sm bg-yellow-400 text-white rounded hover:bg-yellow-500"
            >
              編集
            </button>

            <button
              onClick={() => onDelete(id)}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            >
              削除
            </button>
          </div>
        </div>

        {/* 入力フォーム表示 */}
        {showInput && (
          <div onClick={(e) => e.stopPropagation()}>
            <TaskInput
              input={input}
              setInput={setInput}
              deadline={deadline ?? ""}
              setDeadline={setDeadline}
              parentId={parentId}
              setParentId={setParentId}
              onSubmit={addtask} /* ★ 追加 */
              submitLabel="追加" /* ★ 追加 */
              setShowInput={setShowInput}
              id={id}
            />
          </div>
        )}
        {/* ▼ 末尾で子タスクを描画 */}
        {children}
      </div>
    </li>
  );
}
