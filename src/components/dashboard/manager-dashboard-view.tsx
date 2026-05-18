"use client"

import Link from "next/link"
import { Users, ClipboardList, CheckCircle, Clock, TrendingUp, Download } from "lucide-react"
import { PageShell, PageHeader, StatCard, TrackedCard, PrimaryButton, SecondaryButton } from "@/components/ui/tracked"
import { ScrollReveal, StaggerGrid, StaggerItem } from "@/components/ui/motion"
import { motion } from "framer-motion"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts"

type TeamMember = {
  id: string
  name: string
  email: string
  goals: { status: string; weightage: number; progress: number }[]
}

const COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"]

export function ManagerDashboardView({ team }: { team: TeamMember[] }) {
  const pendingApprovals = team.flatMap(emp => emp.goals.filter(g => g.status === "SUBMITTED"))
  const approvedGoals = team.flatMap(emp => emp.goals.filter(g => g.status === "APPROVED" || g.status === "LOCKED"))
  const totalGoals = team.flatMap(emp => emp.goals)

  // Avg progress across team for approved/locked goals
  const avgTeamProgress = (() => {
    const tracked = team.flatMap(emp => emp.goals.filter(g => g.status === "APPROVED" || g.status === "LOCKED"))
    if (!tracked.length) return 0
    return Math.round(tracked.reduce((s, g) => s + g.progress, 0) / tracked.length)
  })()

  // Chart data — per-employee average progress
  const chartData = team.map((emp, i) => {
    const tracked = emp.goals.filter(g => g.status === "APPROVED" || g.status === "LOCKED")
    const avg = tracked.length ? Math.round(tracked.reduce((s, g) => s + g.progress, 0) / tracked.length) : 0
    return { name: emp.name.split(" ")[0], avg, color: COLORS[i % COLORS.length] }
  })

  const stats = [
    { label: "Team Members", value: team.length, icon: Users, color: "#6366f1" },
    { label: "Pending Approvals", value: pendingApprovals.length, icon: Clock, color: "#f59e0b" },
    { label: "Approved Goals", value: approvedGoals.length, icon: CheckCircle, color: "#10b981" },
    { label: "Avg Progress", value: `${avgTeamProgress}%`, icon: TrendingUp, color: "#8b5cf6" },
  ]

  return (
    <PageShell>
      <PageHeader 
        title="Team Dashboard" 
        subtitle="Manage your team's goals, progress and quarterly check-ins" 
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
            <StatCard {...s} index={i} />
          </StaggerItem>
        ))}
      </StaggerGrid>

      {pendingApprovals.length > 0 && (
        <ScrollReveal className="mb-6">
          <motion.div
            className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60"
            whileHover={{ scale: 1.005 }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 8, -8, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, repeatDelay: 3 }}
              >
                <Clock className="w-6 h-6 text-amber-600" />
              </motion.div>
              <div>
                <p className="font-semibold text-sm text-amber-900">
                  {pendingApprovals.length} goals awaiting your approval
                </p>
                <p className="text-xs text-amber-700/80 mt-0.5">Review and approve or return for rework</p>
              </div>
            </div>
            <PrimaryButton href="/manager/approvals" className="!bg-amber-500 !shadow-amber-500/30">
              Review Now
            </PrimaryButton>
          </motion.div>
        </ScrollReveal>
      )}

      {/* Team Progress Chart */}
      {chartData.length > 0 && chartData.some(d => d.avg > 0) && (
        <ScrollReveal delay={0.1} className="mb-6">
          <TrackedCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">Team Goal Progress</h2>
              <span className="text-xs text-slate-400 font-medium">Avg % achievement on approved goals</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barSize={32} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v) => [`${v}%`, "Avg Progress"]}
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                  cursor={{ fill: "rgba(99,102,241,0.06)" }}
                />
                <Bar dataKey="avg" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </TrackedCard>
        </ScrollReveal>
      )}

      {/* Team member overview with progress */}
      <ScrollReveal delay={0.15}>
        <TrackedCard className="overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Team Overview</h2>
            <Link href="/manager/team" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              View All →
            </Link>
          </div>
          {team.length === 0 ? (
            <p className="py-12 text-center text-slate-500">No team members assigned yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {team.map((emp, i) => {
                const submitted = emp.goals.filter(g => g.status === "SUBMITTED").length
                const approved = emp.goals.filter(g => g.status === "APPROVED" || g.status === "LOCKED").length
                const tracked = emp.goals.filter(g => g.status === "APPROVED" || g.status === "LOCKED")
                const avgProgress = tracked.length
                  ? Math.round(tracked.reduce((s, g) => s + g.progress, 0) / tracked.length)
                  : 0
                const progressColor = avgProgress >= 75 ? "#10b981" : avgProgress >= 40 ? "#f59e0b" : "#6366f1"
                return (
                  <motion.div
                    key={emp.id}
                    className="px-4 sm:px-6 py-4"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ backgroundColor: "rgba(99,102,241,0.04)" }}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <motion.div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0"
                          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                          whileHover={{ scale: 1.08 }}
                        >
                          {emp.name.charAt(0)}
                        </motion.div>
                        <div>
                          <p className="font-medium text-sm text-slate-900">{emp.name}</p>
                          <p className="text-xs text-slate-500">{emp.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-center lg:ml-auto shrink-0">
                        {[
                          { v: emp.goals.length, l: "Goals", c: "text-slate-900" },
                          { v: submitted, l: "Pending", c: "text-amber-600" },
                          { v: approved, l: "Approved", c: "text-emerald-600" },
                        ].map(cell => (
                          <div key={cell.l}>
                            <p className={`font-bold text-lg ${cell.c}`}>{cell.v}</p>
                            <p className="text-xs text-slate-400">{cell.l}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Progress bar for this employee */}
                    {tracked.length > 0 && (
                      <div className="mt-3 ml-0 lg:ml-13">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[11px] text-slate-400 font-medium">Avg Goal Progress</span>
                          <span className="text-[11px] font-bold" style={{ color: progressColor }}>{avgProgress}%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden bg-slate-100">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: progressColor }}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${avgProgress}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.1 }}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </TrackedCard>
      </ScrollReveal>
    </PageShell>
  )
}
