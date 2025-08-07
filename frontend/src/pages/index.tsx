import React, { useState } from "react";
import type { Task } from "../types/task";
import TaskItem from "../components/TaskItem";
import TaskInput from "../components/TaskInput";
import { nanoid } from "nanoid";
import { useTasks } from "@/store/useTasks";

const Index = () => {
  const [input, setInput] = useState<string>(""); // テキストエリアの入力状態
  const { tasks, setTasks, points, setPoints } = useTasks();
  const [deadline, setDeadline] = useState<string>(""); // ← 追加
  const [showInput, setShowInput] = useState(false);
  const [parentId, setParentId] = useState<string>("");
  const [timelineRootId, setTimelineRootId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null); // どのタスクを編集中か

  const toggleTimeline = (id: string) =>
    setTimelineRootId((prev) => (prev === id ? null : id));

  const saveTask = () => {
    if (!editingId) return;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === editingId
          ? { ...t, title: input, deadline, parentId: parentId || undefined }
          : t
      )
    );

    // 後片づけ
    setEditingId(null);
    setInput("");
    setDeadline("");
    setShowInput(false);
    setParentId(""); // ← ここもクリアしておくと良い
  };

  const addtask = () => {
    if (!input.trim()) return;

    const newTask: Task = {
      id: nanoid(6),
      title: input.trim(),
      completed: false,
      children: [],
      deadline: deadline || undefined,
      parentId: parentId || undefined,
    };

    // ← どんな場合でもまず flat 配列に追加
    setTasks((prev) => [newTask, ...prev]);

    // 入力リセット
    setInput("");
    setDeadline("");
    setParentId("");
  };

  const toggleTask = (id: string) => {
    // 対象タスクを探す
    const targetTask = tasks.find((task) => task.id === id);
    if (!targetTask) return;

    // 子タスクの未完了チェック（略）

    const newCompleted = !targetTask.completed;

    // ポイント増減
    setPoints((prev) => (newCompleted ? prev + 1 : prev - 1));

    // 完了状態＋日時を更新
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              completed: newCompleted,
              completedAt: newCompleted ? new Date().toISOString() : undefined,
            }
          : task
      )
    );
  };

  const onDelete = (id: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
  };
  function buildTaskTree(tasks: Task[]): Task[] {
    const taskMap: Record<string, Task & { children: Task[] }> = {};
    const roots: Task[] = [];

    // 初期化
    tasks.forEach((task) => {
      taskMap[task.id] = { ...task, children: [] };
    });

    // 親子関係を構築
    tasks.forEach((task) => {
      if (task.parentId && taskMap[task.parentId]) {
        taskMap[task.parentId].children.push(taskMap[task.id]);
      } else {
        roots.push(taskMap[task.id]); // parentIdがない＝ルート
      }
    });

    return roots;
  }

  const tree = buildTaskTree(tasks);
  // Index.tsx 内の return の直前に追加
  const renderTasks = (nodes: Task[], level = 0): React.ReactElement[] =>
    nodes
      .filter((t) => !t.completed)
      .flatMap((t) => {
        const { children: childArray, ...taskProps } = t; // ← ★ children を除外

        if (t.id === timelineRootId) {
          return [
            <TaskItem
              key={t.id}
              {...taskProps} // ✅ children を含めない
              level={level}
              toggleTask={toggleTask}
              onDelete={onDelete}
              setDeadline={setDeadline}
              setShowInput={setShowInput}
              parentId={parentId}
              setParentId={setParentId}
              setInput={setInput}
              input={input}
              addtask={addtask}
              timelineRootId={timelineRootId}
              setTimelineRootId={setTimelineRootId}
              toggleTimeline={toggleTimeline}
              setEditingId={setEditingId}
              editingId={editingId}
              saveTask={saveTask}
            />,
            ...flattenAndSortByDeadline(t).map((c) => {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { children: _omit, ...childProps } = c; // children 除外
              return (
                <TaskItem
                  key={c.id}
                  {...childProps}
                  level={level + 1}
                  toggleTask={toggleTask}
                  onDelete={onDelete}
                  setDeadline={setDeadline}
                  setShowInput={setShowInput}
                  parentId={parentId}
                  setParentId={setParentId}
                  setInput={setInput}
                  input={input}
                  addtask={addtask}
                  timelineRootId={timelineRootId}
                  setTimelineRootId={setTimelineRootId}
                  toggleTimeline={toggleTimeline}
                  setEditingId={setEditingId}
                  editingId={editingId}
                  saveTask={saveTask}
                />
              );
            }),
          ];
        }

        // ふつうのツリー描画
        return [
          <TaskItem
            key={t.id}
            {...taskProps} // ✅ children を含めない
            level={level}
            toggleTask={toggleTask}
            onDelete={onDelete}
            setDeadline={setDeadline}
            setShowInput={setShowInput}
            parentId={parentId}
            setParentId={setParentId}
            setInput={setInput}
            input={input}
            addtask={addtask}
            timelineRootId={timelineRootId}
            setTimelineRootId={setTimelineRootId}
            setEditingId={setEditingId}
            toggleTimeline={toggleTimeline}
            editingId={editingId}
            saveTask={saveTask}
          >
            {renderTasks(childArray, level + 1)} {/* ← 再帰描画 */}
          </TaskItem>,
        ];
      });

  function flattenAndSortByDeadline(task: Task): Task[] {
    const result: Task[] = [];

    function traverse(t: Task) {
      result.push(t);
      t.children?.forEach(traverse);
    }

    task.children?.forEach(traverse);

    return result.sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
    });
  }

  return (
    <div className="flex w-full h-screen">
      {/* メインコンテンツ */}
      <div className="flex-1 p-4 overflow-y-auto relative">
        <div className="ml-50 font-bold text-gray-700">{points}pt</div>

        <ul>{renderTasks(tree)}</ul>
        <button
          onClick={() => setShowInput(!showInput)}
          className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-blue-500 text-white text-2xl font-bold shadow-lg hover:bg-blue-600 transition duration-200"
        >
          +
        </button>
        {editingId === null && showInput && (
          <TaskInput
            input={input}
            setInput={setInput}
            setDeadline={setDeadline}
            addTask={addtask}
            setShowInput={setShowInput}
            parentId={parentId}
            setParentId={setParentId}
            deadline={deadline ?? ""}
            id=""
            onSubmit={addtask} // ✅ ここを addtask にする
            submitLabel="追加"
            setEditingId={setEditingId}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
