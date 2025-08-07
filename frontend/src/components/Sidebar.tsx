"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  List,
  Zap,
  GitBranch, // ← Network の代替
  History,
  Settings,
} from "lucide-react";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useRouter();

  const items = [
    { href: "/dashboard", label: "ダッシュボード", Icon: Home },
    { href: "/", label: "タスク一覧", Icon: List },
    { href: "/now", label: "NOW!!", Icon: Zap },
    { href: "/network", label: "ネットワークビュー", Icon: GitBranch },
    { href: "/logs", label: "ログ", Icon: History },
    { href: "/settings", label: "設定", Icon: Settings },
  ] as const;

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <div
      className={`h-screen bg-gray-900 text-white transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* ── Header ───────────────────────────── */}
      <div className="flex items-center justify-between p-2">
        {!collapsed && <span className="text-lg font-bold">TasQuest</span>}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="p-1"
          aria-label={collapsed ? "サイドバーを開く" : "サイドバーを閉じる"}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* ── Navigation Links ─────────────────── */}
      <nav className="flex flex-col gap-1 p-2">
        {items.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 rounded px-3 py-2 transition-colors ${
              isActive(href)
                ? "bg-gray-800 text-white"
                : "text-gray-300 hover:bg-gray-700"
            }`}
            aria-current={isActive(href) ? "page" : undefined}
            title={collapsed ? label : undefined}
          >
            <Icon size={20} />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
      </nav>
    </div>
  );
}
