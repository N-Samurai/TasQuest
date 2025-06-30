import React, { useState, useEffect } from "react";
import type { Task } from "../types/task";
import TaskItem from "../components/TaskItem";
import TaskInput from "../components/TaskInput";
import { nanoid } from "nanoid";

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>([]); // タスクリスト
  const [input, setInput] = useState<string>(""); // テキストエリアの入力状態
  const [points, setPoints] = useState<number>(0);
  const [deadline, setDeadline] = useState<string>(""); // ← 追加
  const [showInput, setShowInput] = useState(false);
  const [parentId, setParentId] = useState<string>("");
  const [timelineRootId, setTimelineRootId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null); // どのタスクを編集中か
  const [visible, setVisible] = useState(true);
  const [showInvisible, setShowInvisible] = useState(false);

  useEffect(() => {
    window.api.loadTasks().then((data) => {
      // tasks / points が無いケースを必ず潰す
      const result = data as { tasks?: Task[]; points?: number };

      setTasks(result.tasks ?? []); // ← ★ nullish 合体で必ず配列に
      setPoints(result.points ?? 0);
    });
  }, []);

  useEffect(() => {
    window.api.saveTasks({ tasks, points }); // キャスト不要
  }, [tasks, points]);

  const toggleTimeline = (id: string) =>
    setTimelineRootId((prev) => (prev === id ? null : id));

  const saveTask = () => {
    if (!editingId) return;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === editingId
          ? {
              ...t,
              title: input,
              deadline,
              parentId: parentId || undefined,
              visible,
            }
          : t
      )
    );
    // 後片づけ
    setEditingId(null);
    setInput("");
    setDeadline("");
    setShowInput(false);
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
      visible,
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

    // 子タスクに未完了があるかどうか確認（親→子を調べる）
    const hasUncompletedChildren = tasks.some(
      (task) => task.parentId === id && !task.completed
    );

    // まだ完了していない状態で、子タスクが未完了なら完了を禁止
    if (!targetTask.completed && hasUncompletedChildren) {
      alert("未完了の子タスクがあるため、完了できません。");
      return;
    }

    const newCompleted = !targetTask.completed;

    // ポイント加算・減算
    setPoints((prevPoints) => (newCompleted ? prevPoints + 1 : prevPoints - 1));

    // 完了状態を更新
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === id ? { ...task, completed: newCompleted } : task
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
      .filter((t) => !t.completed && (showInvisible || t.visible !== false))

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
              showInput={showInput}
              parentId={parentId}
              setParentId={setParentId}
              setInput={setInput}
              input={input}
              addtask={addtask}
              timelineRootId={timelineRootId}
              setTimelineRootId={setTimelineRootId}
              toggleTimeline={toggleTimeline}
              setEditingId={setEditingId}
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
                  showInput={showInput}
                  parentId={parentId}
                  setParentId={setParentId}
                  setInput={setInput}
                  input={input}
                  addtask={addtask}
                  timelineRootId={timelineRootId}
                  setTimelineRootId={setTimelineRootId}
                  toggleTimeline={toggleTimeline}
                  setEditingId={setEditingId}
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
            showInput={showInput}
            parentId={parentId}
            setParentId={setParentId}
            setInput={setInput}
            input={input}
            addtask={addtask}
            timelineRootId={timelineRootId}
            setTimelineRootId={setTimelineRootId}
            setEditingId={setEditingId}
            toggleTimeline={toggleTimeline}
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
    <div className="w-full h-screen p-4 overflow-y-auto">
      <div className="ml-4 font-bold text-gray-700">{points}pt</div>
      {/* 👁 非表示タスク表示トグル */}
      <div className="flex items-center gap-2 mb-4 ml-4 text-sm text-gray-700">
        <input
          type="checkbox"
          id="show-invisible"
          checked={showInvisible}
          onChange={() => setShowInvisible(!showInvisible)}
          className="w-4 h-4 accent-blue-600"
        />
        <label htmlFor="show-invisible">非表示タスクも表示</label>
      </div>

      <ul>{renderTasks(tree)}</ul>
      <button
        onClick={() => {
          setEditingId(null); // 編集IDをクリア → 「追加」モードに
          setInput(""); // 入力テキストをクリア
          setDeadline(""); // 期限もクリア
          setParentId(""); // 親IDもクリア（親なしにする）
          setVisible(true); // 非表示トグルはデフォルト表示ON
          setShowInput(true); // 入力フォームを開く
        }}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-blue-500 text-white text-2xl font-bold shadow-lg hover:bg-blue-600 transition duration-200"
      >
        +
      </button>
      {showInput && (
        <TaskInput
          input={input}
          setInput={setInput}
          setDeadline={setDeadline}
          addTask={addtask}
          setShowInput={setShowInput}
          parentId={parentId}
          setParentId={setParentId}
          onSubmit={editingId ? saveTask : addtask} // ★ ここだけ切替
          submitLabel={editingId ? "保存" : "追加"}
          deadline={deadline ?? ""} /* ★ 追加: 空文字で OK */
          id={editingId ?? ""}
          visible={visible} // ← ★ 追加
          setVisible={setVisible}
        />
      )}
    </div>
  );
};

export default Index;
