"use client"

import Link from "next/link"
import { Users, Target, CheckCircle, Shield, Download, type LucideIcon } from "lucide-react"
import { formatAuditEntry } from "@/lib/audit-format"
import { PageShell, PageHeader, StatCard, TrackedCard, PrimaryButton, SecondaryButton, AnimatedProgress, statusBadge } from "@/components/ui/tracked"
import { ScrollReveal, StaggerGrid, StaggerItem } from "@/components/ui/motion"
import { motion } from "framer-motion"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts"

const statIcons: Record<string, LucideIcon> = {
  users: Users,
  target: Target,
  checkCircle: CheckCircle,
  shield: Shield,
}

type StatIconKey = keyof typeof statIcons

type Props = {
  activePhaseLabel?: string
  stats: { label: string; value: number; icon: StatIconKey; color: string }[]
  goalStatuses: { label: string; count: number; color: string }[]
  totalGoals: number
  employeeCompletion: { name: string; checkinsDone: number; goalCount: number; manager: string; complete: boolean; avgProgress: number }[]
  managerCompletion: { name: string; reviewed: number; total: number; teamSize: number; complete: boolean }[]
  activeQuarter: string
  recentAuditLogs: {
    id: string
    entityType: string
    entityId: string
    changedBy: string
    oldValue: string | null
    newValue: string | null
    timestamp: Date | string
  }[]
  auditGoalMap: Record<string, { title: string; status: string; employee: { name: string } }>
  auditUserMap: Record<string, string>
  recentGoals: { id: string; title: string; status: string; updatedAt: Date | string; employee: { name: string } }[]
}

export function AdminDashboardView(props: Props) {
  const {
    activePhaseLabel,
    stats,
    goalStatuses,
    totalGoals,
    employeeCompletion,
    managerCompletion,
    activeQuarter,
    recentAuditLogs,
    auditGoalMap,
    auditUserMap,
    recentGoals,
  } = props

  return (
    <PageShell>
      <PageHeader
        title="Admin Dashboard"
        subtitle={activePhaseLabel ? `Active cycle: ${activePhaseLabel}` : "Organization-wide goal tracking overview"}
        action={
          <div className="flex items-center gap-3">
            <a href="/api/export" className="inline-flex">
              <SecondaryButton>
                <Download className="w-4 h-4" />
                Export CSV
              </SecondaryButton>
            </a>
            <a href="/export/pdf" target="_blank" rel="noopener noreferrer" className="inline-flex">
              <PrimaryButton>
                <Download className="w-4 h-4" />
                Export PDF
              </PrimaryButton>
            </a>
          </div>
        }
      />

      <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <StaggerItem key={s.label}>
            <StatCard label={s.label} value={s.value} icon={statIcons[s.icon]} color={s.color} index={i} />
          </StaggerItem>
        ))}
      </StaggerGrid>

      <ScrollReveal delay={0.05}>
        <TrackedCard className="p-6 mb-8">
          <h2 className="font-semibold text-slate-900 mb-4">Goal Status Distribution</h2>
          <div className="space-y-4">
            {goalStatuses.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm font-medium text-slate-700">{item.label}</span>
                  <span className="text-sm font-bold" style={{ color: item.color }}>{item.count}</span>
                </div>
                <AnimatedProgress
                  value={item.count}
                  max={totalGoals || 1}
                  color={item.color}
                  delay={i * 0.08}
                />
              </motion.div>
            ))}
          </div>
        </TrackedCard>
      </ScrollReveal>

      {/* Org-wide employee progress chart */}
      {employeeCompletion.length > 0 && (
        <ScrollReveal delay={0.08} className="mb-8">
          <TrackedCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">Employee Progress Overview</h2>
              <span className="text-xs text-slate-400">Avg progress % on approved goals</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={employeeCompletion.map((e, i) => ({ name: e.name.split(" ")[0], progress: e.avgProgress, color: ["#6366f1","#8b5cf6","#06b6d4","#10b981","#f59e0b","#ef4444"][i % 6] }))} barSize={28} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [`${v}%`, "Progress"]} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
                <Bar dataKey="progress" radius={[8, 8, 0, 0]}>
                  {employeeCompletion.map((_, i) => (
                    <Cell key={i} fill={["#6366f1","#8b5cf6","#06b6d4","#10b981","#f59e0b","#ef4444"][i % 6]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </TrackedCard>
        </ScrollReveal>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ScrollReveal delay={0.1}>
          <TrackedCard className="p-6 h-full">
            <h2 className="font-semibold text-slate-900 mb-4">Employee Check-in ({activeQuarter})</h2>
            <div className="space-y-3">
              {employeeCompletion.map((emp, i) => (
                <motion.div
                  key={emp.name}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{emp.name}</p>
                    <p className="text-xs text-slate-500">{emp.checkinsDone}/{emp.goalCount} goals · {emp.manager}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${emp.complete ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    {emp.complete ? "Complete" : "Pending"}
                  </span>
                </motion.div>
              ))}
            </div>
          </TrackedCard>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <TrackedCard className="p-6 h-full">
            <h2 className="font-semibold text-slate-900 mb-4">Manager Reviews ({activeQuarter})</h2>
            <div className="space-y-3">
              {managerCompletion.map((mgr, i) => (
                <motion.div
                  key={mgr.name}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{mgr.name}</p>
                    <p className="text-xs text-slate-500">{mgr.reviewed}/{mgr.total} reviewed · {mgr.teamSize} reports</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${mgr.complete ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    {mgr.complete ? "Complete" : "Pending"}
                  </span>
                </motion.div>
              ))}
            </div>
          </TrackedCard>
        </ScrollReveal>
      </div>

      <ScrollReveal delay={0.2}>
        <TrackedCard className="overflow-hidden mb-6">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Recent Audit Activity</h2>
            <Link href="/admin/audit" className="text-sm font-medium text-indigo-600">View Full →</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentAuditLogs.map((log, i) => {
              const goal = log.entityType === "Goal" ? auditGoalMap[log.entityId] : null
              const isUnlock = log.newValue?.includes("ADMIN_UNLOCK")
              return (
                <motion.div
                  key={log.id}
                  className="px-6 py-3 flex items-center gap-4"
                  style={isUnlock ? { background: "rgba(16,185,129,0.06)" } : undefined}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {goal ? goal.title : `${log.entityType} event`}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {auditUserMap[log.changedBy] || "System"} · {formatAuditEntry(log.oldValue, log.newValue)}
                    </p>
                  </div>
                  {isUnlock && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 shrink-0">UNLOCKED</span>
                  )}
                </motion.div>
              )
            })}
          </div>
        </TrackedCard>
      </ScrollReveal>

      <ScrollReveal delay={0.25}>
        <TrackedCard className="overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Recent Goal Updates</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {recentGoals.map((goal, i) => (
              <motion.div
                key={goal.id}
                className="px-6 py-3 flex items-center gap-4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0">
                  {goal.employee.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{goal.title}</p>
                  <p className="text-xs text-slate-500">{goal.employee.name}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${statusBadge[goal.status] || ""}`}>
                  {goal.status}
                </span>
              </motion.div>
            ))}
          </div>
        </TrackedCard>
      </ScrollReveal>
    </PageShell>
  )
}
