import type { Task } from "../types/task";
import TaskInput from "../components/TaskInput";
import React, { ReactNode, useState } from "react"; // useState を追加

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
  style?: React.CSSProperties;
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
  style,
}: TaskItemProps) {
  const [isOpen, setIsOpen] = useState(true);
  // useState 追加（フィードバック用・任意）
  const [copied, setCopied] = useState(false);

  // コピー関数
  const handleCopyId = () => {
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500); // 1.5秒でリセット
    });
  };

  return (
    <li style={style}>
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
              <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded bg-red-100 text-red-600">
                {deadline}
              </span>
            </div>
            {/* ▼ 折りたたみトグルボタン */}
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
        {isOpen && children}
      </div>
    </li>
  );
}
