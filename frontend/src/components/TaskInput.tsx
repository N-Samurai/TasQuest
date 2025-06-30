import React, { useEffect, useRef } from "react";

interface TaskInputProps {
  input: string;
  setInput: (val: string) => void;
  deadline: string;
  setDeadline: (val: string) => void;
  setShowInput: (val: boolean) => void;
  id: string;
  parentId?: string;
  setParentId: (parentId: string) => void;
  onSubmit: () => void;
  submitLabel: string;
  addTask?: () => void;
  // 👇 インビジブル関連を追加
  visible: boolean;
  setVisible: (val: boolean) => void;
}

export default function TaskInput({
  input,
  setInput,
  deadline,
  setDeadline,
  setShowInput,
  id,
  parentId,
  setParentId,
  onSubmit, // ★ 追加
  submitLabel,
  visible, // ★追加
  setVisible,
}: TaskInputProps) {
  // TaskInput コンポーネント内に追加
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus(); // マウント時に自動フォーカス
  }, []);

  return (
    <div className="fixed inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-[500px] max-w-full">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-gray-700 mb-1 block">タスク名</label>
            <input
              ref={inputRef}
              className="w-full h-10 px-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="タスクを入力..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault(); // フォーム送信防止（念のため）
                  onSubmit();
                  setShowInput(false);
                }
              }}
            />
          </div>
          <div>{id}</div>
          <input
            type="text"
            className="w-full h-10 px-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="親タスクのid"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
          />
          <div>
            <label className="text-sm text-gray-700 mb-1 block">期限</label>
            <input
              type="date"
              className="w-full h-10 px-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
          {/* 🔽 インビジブルスイッチ */}
          <div className="flex items-center gap-2 mt-2">
            <label className="text-sm text-gray-700">
              このタスクを非表示にする
            </label>
            <input
              type="checkbox"
              checked={!visible}
              onChange={(e) => setVisible(!e.target.checked)}
              className="w-5 h-5 accent-blue-600"
            />
          </div>
          <div className="flex justify-end gap-2">
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  onSubmit();
                  setShowInput(false);
                }}
                className="h-10 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {submitLabel} {/* ★ 追加 or 保存 */}
              </button>
              <button
                onClick={() => setShowInput(false)}
                className="h-10 px-6 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-shadow shadow-inner"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
