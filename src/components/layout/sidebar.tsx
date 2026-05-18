"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import {
  Target, LayoutDashboard, CheckSquare, BarChart3,
  Users, Settings, LogOut, ChevronRight, ClipboardList, Shield, Menu, X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { NotificationsBell } from "./notifications-bell"
import { Logo } from "../ui/logo"

const employeeNav = [
  { href: "/employee/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employee/goals", label: "My Goals", icon: Target },
  { href: "/employee/checkins", label: "Check-ins", icon: CheckSquare },
]

const managerNav = [
  { href: "/manager/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/manager/approvals", label: "Approvals", icon: ClipboardList },
  { href: "/manager/shared", label: "Shared Goals", icon: Target },
  { href: "/manager/team", label: "My Team", icon: Users },
  { href: "/manager/checkins", label: "Reviews", icon: CheckSquare },
]

const adminNav = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/goals", label: "Goal Unlock", icon: Target },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/audit", label: "Audit Trail", icon: Shield },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

const roleBadgeColor: Record<string, string> = {
  ADMIN: "bg-emerald-50 text-emerald-700",
  MANAGER: "bg-sky-50 text-sky-700",
  EMPLOYEE: "bg-indigo-50 text-indigo-700",
}

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role ?? "EMPLOYEE"
  const [isOpen, setIsOpen] = useState(false)

  const navItems =
    role === "ADMIN" ? adminNav : role === "MANAGER" ? managerNav : employeeNav

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden shrink-0 flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 z-40 shadow-sm relative">
        <Logo showText={true} size={30} />
        <div className="flex items-center gap-1">
          <NotificationsBell />
          <button onClick={() => setIsOpen(true)} className="p-1.5 bg-slate-100 text-slate-600 hover:text-slate-900 rounded-md">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && <div className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsOpen(false)} />}

      <aside className={cn(
        "flex flex-col w-64 h-screen fixed md:sticky top-0 shrink-0 bg-white border-r border-slate-200/80 shadow-[4px_0_24px_rgba(99,102,241,0.04)] z-50 transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="flex shrink-0 items-center justify-between gap-3 px-6 py-5 border-b border-slate-100">
          <Logo showText={true} size={36} />
          <button className="md:hidden text-slate-400 p-1 rounded-md hover:bg-slate-100" onClick={() => setIsOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

      <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-0.5">
        <p className="text-xs font-semibold uppercase tracking-widest px-3 mb-3 text-slate-400">
          {role === "ADMIN" ? "Admin" : role === "MANAGER" ? "Manager" : "Employee"}
        </p>
        {navItems.map(({ href, label, icon: Icon }, i) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <motion.div
              key={href}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                href={href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                  active
                    ? "text-white shadow-md shadow-indigo-200/50"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
                style={
                  active
                    ? { background: "linear-gradient(135deg, #6366f1, #7c3aed)" }
                    : undefined
                }
              >
                <Icon className={cn("w-4 h-4", active ? "text-white" : "text-slate-400 group-hover:text-indigo-500")} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight className="w-3 h-3 text-white/80" />}
              </Link>
            </motion.div>
          )
        })}
      </nav>

      <motion.div
        className="shrink-0 px-3 pt-3 pb-4 border-t border-slate-100"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-50 border border-slate-100">
          <motion.div
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            whileHover={{ scale: 1.06 }}
          >
            {session?.user?.name?.charAt(0) ?? "U"}
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-900 text-xs font-semibold truncate">{session?.user?.name}</p>
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", roleBadgeColor[role])}>
              {role}
            </span>
          </div>
          <NotificationsBell direction="up" />
          <button
            id="logout-btn"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
      </aside>
    </>
  )
}
