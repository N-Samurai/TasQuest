import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Home, List } from "lucide-react";

export default function Sidebar({ onNewTask }: { onNewTask: () => void }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`h-screen bg-gray-900 text-white transition-all duration-300 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      <div className="flex items-center justify-between p-2">
        {!collapsed && <span className="text-lg font-bold">TasQuest</span>}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1">
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex flex-col gap-2 p-2">
        <button className="flex items-center gap-2 hover:bg-gray-700 rounded p-2">
          <Home size={20} />
          {!collapsed && <span>ダッシュボード</span>}
        </button>

        <button className="flex items-center gap-2 hover:bg-gray-700 rounded p-2">
          <List size={20} />
          {!collapsed && <span>タスク一覧</span>}
        </button>

        <button
          onClick={onNewTask}
          className="flex items-center gap-2 hover:bg-gray-700 rounded p-2"
        >
          <Plus size={20} />
          {!collapsed && <span>新規タスク</span>}
        </button>
      </nav>
    </div>
  );
}
