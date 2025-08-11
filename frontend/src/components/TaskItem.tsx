import type { Task } from "../types/task";
import TaskInput from "../components/TaskInput";
import React, { ReactNode, useState } from "react";

interface TaskItemProps extends Omit<Task, "children"> {
  toggleTask: (id: string) => void;
  onDelete: (id: string) => void;
  setDeadline: (deadline: string) => void;
  level?: number;

  setShowInput: (show: boolean) => void;
  input: string;
  setInput: (input: string) => void;
  addtask: () => void;
  parentId?: string;
  setParentId: (parentId: string) => void;
  timelineRootId: string | null;
  setTimelineRootId: (id: string | null) => void;
  children?: ReactNode;
  setEditingId: (id: string | null) => void;
  toggleTimeline: (id: string) => void;
  style?: React.CSSProperties;
  editingId: string | null;
  saveTask: () => void;

  /** 👇 未完了の子孫がいるか（呼び出し側で計算して渡す） */
  blockedByChildren: boolean;
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
  style,
  editingId,
  saveTask,
  blockedByChildren,
}: TaskItemProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const cannotComplete = blockedByChildren && !completed;

  return (
    <div style={style}>
      <div style={{ marginLeft: `${level * 24}px` }}>
        <div className="flex items-center justify-between p-4 bg-white shadow rounded hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={completed}
              /* ✅ 子孫が未完了のときは完了にできない */
              disabled={cannotComplete}
              onChange={() => {
                if (cannotComplete) return; // 念のため二重ガード
                toggleTask(id);
              }}
              className="w-5 h-5 accent-blue-500"
              title={
                cannotComplete
                  ? "未完了の子タスクがあるため完了にできません"
                  : ""
              }
            />
            <div>
              <div
                className={`text-base ${
                  completed ? "line-through text-gray-400" : "text-gray-800"
                }`}
              >
                {title}
              </div>
              <div
                onClick={handleCopyId}
                className="text-sm text-gray-600 cursor-pointer hover:text-blue-600"
                title="クリックしてIDをコピー"
              >
                {id}{" "}
                {copied && (
                  <span className="text-green-500 ml-2">✅ コピーしました</span>
                )}
              </div>
              {deadline && (
                <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded bg-red-100 text-red-600">
                  {deadline}
                </span>
              )}
            </div>

            {/* ▼ 折りたたみ */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-500 hover:text-gray-700 text-xl w-6"
              title="子タスクを開閉"
            >
              {isOpen ? "▾" : "▸"}
            </button>
          </div>

          <div className="flex gap-2 ml-4">
            <button
              onClick={() => toggleTimeline(id)}
              className={`px-3 py-1 text-sm rounded text-white ${
                timelineRootId === id
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-purple-500 hover:bg-purple-600"
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

        {editingId === id && (
          <div onClick={(e) => e.stopPropagation()}>
            <TaskInput
              input={input}
              setInput={setInput}
              deadline={deadline ?? ""}
              setDeadline={setDeadline}
              parentId={parentId}
              setParentId={setParentId}
              setShowInput={setShowInput}
              id={id}
              onSubmit={editingId === id ? saveTask : addtask}
              submitLabel={editingId === id ? "保存" : "追加"}
              setEditingId={setEditingId}
            />
          </div>
        )}

        {isOpen && children}
      </div>
    </div>
  );
}
