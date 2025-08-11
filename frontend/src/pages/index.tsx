import React, { useMemo, useState } from "react";
import type { Task } from "../types/task";
import TaskItem from "../components/TaskItem";
import TaskInput from "../components/TaskInput";
import { nanoid } from "nanoid";
import { useTasks } from "@/store/useTasks";
import Celebration from "@/components/effects/Celebration";

const Index = () => {
  const [input, setInput] = useState<string>("");
  const { tasks, setTasks, points, setPoints } = useTasks();
  const [deadline, setDeadline] = useState<string>("");
  const [showInput, setShowInput] = useState(false);
  const [parentId, setParentId] = useState<string>("");
  const [timelineRootId, setTimelineRootId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  const toggleTimeline = (id: string) =>
    setTimelineRootId((prev) => (prev === id ? null : id));

  /* === 子孫未完了チェック用のマップを作成（flat 配列から） === */
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

  const hasOpenDescendant = (id: string): boolean => {
    const stack = [...(childrenMap.get(id) ?? [])];
    while (stack.length) {
      const cur = stack.pop()!;
      if (!cur.completed) return true;
      const kids = childrenMap.get(cur.id);
      if (kids) stack.push(...kids);
    }
    return false;
  };

  const saveTask = () => {
    if (!editingId) return;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === editingId
          ? { ...t, title: input, deadline, parentId: parentId || undefined }
          : t
      )
    );
    setEditingId(null);
    setInput("");
    setDeadline("");
    setShowInput(false);
    setParentId("");
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

    setTasks((prev) => [newTask, ...prev]);

    setInput("");
    setDeadline("");
    setParentId("");
  };

  const toggleTask = (id: string) => {
    const target = tasks.find((task) => task.id === id);
    if (!target) return;

    if (!target.completed && hasOpenDescendant(id)) {
      alert("未完了の子タスクがあるため、親タスクを完了にできません。");
      return;
    }

    const willComplete = !target.completed; // ← 追加

    setPoints((prev) => (willComplete ? prev + 1 : Math.max(0, prev - 1)));

    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              completed: willComplete,
              completedAt: willComplete ? new Date().toISOString() : undefined,
            }
          : task
      )
    );

    if (willComplete) setCelebrate(true); // ← 追加：完了時だけ発火
  };

  const onDelete = (id: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
  };

  function buildTaskTree(tasks: Task[]): Task[] {
    const taskMap: Record<string, Task & { children: Task[] }> = {};
    const roots: Task[] = [];

    tasks.forEach((task) => {
      taskMap[task.id] = { ...task, children: [] };
    });

    tasks.forEach((task) => {
      if (task.parentId && taskMap[task.parentId]) {
        taskMap[task.parentId].children.push(taskMap[task.id]);
      } else {
        roots.push(taskMap[task.id]);
      }
    });

    return roots;
  }

  const tree = buildTaskTree(tasks);

  const renderTasks = (nodes: Task[], level = 0): React.ReactElement[] =>
    nodes
      .filter((t) => !t.completed)
      .flatMap((t) => {
        const { children: childArray, ...taskProps } = t;

        if (t.id === timelineRootId) {
          return [
            <TaskItem
              key={t.id}
              {...taskProps}
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
              blockedByChildren={hasOpenDescendant(t.id)}
            />,
            ...flattenAndSortByDeadline(t).map((c) => {
              const { children: _children, ...childProps } = c;
              void _children; // ← 未使用扱いを回避（参照したので no-unused-vars を満たす）

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
                  blockedByChildren={hasOpenDescendant(c.id)}
                />
              );
            }),
          ];
        }

        return [
          <TaskItem
            key={t.id}
            {...taskProps}
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
            blockedByChildren={hasOpenDescendant(t.id)}
          >
            {renderTasks(childArray, level + 1)}
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
            onSubmit={addtask}
            submitLabel="追加"
            setEditingId={setEditingId}
          />
        )}
      </div>
      <Celebration open={celebrate} onDone={() => setCelebrate(false)} />
    </div>
  );
};

export default Index;
