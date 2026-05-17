"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function PageShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={cn("p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      {children}
    </motion.div>
  )
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <motion.div
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm mt-1.5 text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </motion.div>
  )
}

export function TrackedCard({
  children,
  className,
  hover = true,
}: {
  children: React.ReactNode
  className?: string
  hover?: boolean
}) {
  return (
    <motion.div
      className={cn(
        "rounded-2xl bg-white border border-slate-200/80 shadow-sm",
        "shadow-[0_4px_24px_rgba(99,102,241,0.06)]",
        className,
      )}
      whileHover={hover ? { y: -2, boxShadow: "0 12px 40px rgba(99,102,241,0.12)" } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
    >
      {children}
    </motion.div>
  )
}

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color = "#6366f1",
  index = 0,
}: {
  label: string
  value: string | number
  sub?: string
  icon: LucideIcon
  color?: string
  index?: number
}) {
  return (
    <motion.div
      className="tracked-stat p-5 h-full"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <motion.div
        className="flex items-center justify-between mb-3"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.08 + 0.15 }}
      >
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}14` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </motion.div>
      <motion.p
        className="text-2xl sm:text-3xl font-bold text-slate-900"
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.08 + 0.2, type: "spring", stiffness: 200 }}
      >
        {value}
      </motion.p>
      {sub && <p className="text-xs mt-1 text-slate-400">{sub}</p>}
    </motion.div>
  )
}

export function AnimatedProgress({
  value,
  max = 100,
  color = "#6366f1",
  delay = 0,
}: {
  value: number
  max?: number
  color?: string
  delay?: number
}) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <motion.div
      className="h-2 rounded-full bg-slate-100 overflow-hidden"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ background: `linear-gradient(90deg, ${color}, ${color}99)` }}
        initial={{ width: 0 }}
        whileInView={{ width: `${pct}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      />
    </motion.div>
  )
}

export function PrimaryButton({
  href,
  onClick,
  children,
  className,
}: {
  href?: string
  onClick?: () => void
  children: React.ReactNode
  className?: string
}) {
  const cls = cn(
    "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white",
    "shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-shadow",
    className,
  )
  const style = { background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }

  if (href) {
    return (
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Link href={href} className={cls} style={style}>
          {children}
        </Link>
      </motion.div>
    )
  }
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={cls}
      style={style}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.button>
  )
}

export const statusBadge: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  SUBMITTED: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-600",
  LOCKED: "bg-indigo-50 text-indigo-700",
}
