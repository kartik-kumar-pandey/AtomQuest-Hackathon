"use client"

import Link from "next/link"
import { Target, TrendingUp, CheckCircle, Clock, AlertCircle, Plus, Sparkles } from "lucide-react"
import { computeScore } from "@/lib/goal-utils"
import { PageShell, PageHeader, StatCard, TrackedCard, PrimaryButton, AnimatedProgress, statusBadge } from "@/components/ui/tracked"
import { ScrollReveal, StaggerGrid, StaggerItem } from "@/components/ui/motion"
import { motion } from "framer-motion"
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts"

type Goal = {
  id: string
  title: string
  thrustArea: string | null
  uom: string
  target: number
  weightage: number
  status: string
  progress: number
  checkins: { achievement: number; createdAt: Date | string }[]
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#94a3b8",
  SUBMITTED: "#f59e0b",
  APPROVED: "#10b981",
  REJECTED: "#ef4444",
  LOCKED: "#6366f1",
}

export function EmployeeDashboardView({
  userName,
  goals,
  totalWeightage,
}: {
  userName: string
  goals: Goal[]
  totalWeightage: number
}) {
  const approvedGoals = goals.filter(g => g.status === "APPROVED" || g.status === "LOCKED")
  const pendingGoals = goals.filter(g => g.status === "SUBMITTED")
  const weightageOk = Math.round(totalWeightage) === 100

  // Overall weighted score (from check-ins)
  let overallScore = 0
  for (const goal of approvedGoals) {
    const latest = [...goal.checkins].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0]
    if (latest) {
      overallScore += computeScore(goal.uom, goal.target, latest.achievement) * (goal.weightage / 100)
    }
  }

  // Avg progress on approved/locked goals
  const avgProgress = approvedGoals.length
    ? Math.round(approvedGoals.reduce((s, g) => s + g.progress, 0) / approvedGoals.length)
    : 0

  // Status breakdown for donut chart
  const statusBreakdown = Object.entries(
    goals.reduce((acc, g) => { acc[g.status] = (acc[g.status] || 0) + 1; return acc }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value, color: STATUS_COLORS[name] || "#94a3b8" }))

  const stats = [
    { label: "Total Goals", value: goals.length, sub: `${8 - goals.length} slots left`, icon: Target, color: "#6366f1" },
    { label: "Avg Progress", value: `${avgProgress}%`, sub: "Approved goals", icon: TrendingUp, color: "#10b981" },
    { label: "Approved", value: approvedGoals.length, sub: "Goals locked in", icon: CheckCircle, color: "#8b5cf6" },
    { label: "Pending Review", value: pendingGoals.length, sub: "Awaiting manager", icon: Clock, color: "#f59e0b" },
  ]

  return (
    <PageShell>
      <PageHeader
        title={`Welcome back, ${userName.split(" ")[0]} 👋`}
        subtitle="Track your goals and quarterly progress"
        action={
          <PrimaryButton href="/employee/goals">
            <Plus className="w-4 h-4" />
            Add Goal
          </PrimaryButton>
        }
      />

      {goals.length > 0 && !weightageOk && (
        <ScrollReveal className="mb-6">
          <motion.div
            className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200/80"
            initial={{ x: -12, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600" />
            <p className="text-sm text-amber-800">
              Your total weightage is <strong>{totalWeightage}%</strong>. It must equal <strong>100%</strong> before you can submit.
            </p>
          </motion.div>
        </ScrollReveal>
      )}

      <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <StaggerItem key={s.label}>
            <StatCard {...s} index={i} />
          </StaggerItem>
        ))}
      </StaggerGrid>

      {/* Charts row */}
      {goals.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

          {/* Donut — goal status breakdown */}
          <ScrollReveal delay={0.05}>
            <TrackedCard className="p-5 flex flex-col items-center">
              <p className="font-semibold text-slate-900 text-sm mb-1 self-start">Goal Status Mix</p>
              <p className="text-xs text-slate-400 mb-4 self-start">{goals.length} total goals</p>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={statusBreakdown} dataKey="value" innerRadius={38} outerRadius={58} paddingAngle={3}>
                    {statusBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v, n) => [v, n]}
                    contentStyle={{ borderRadius: 10, fontSize: 12, border: "1px solid #e2e8f0" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
                {statusBreakdown.map(s => (
                  <div key={s.name} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                    <span className="text-[10px] text-slate-500">{s.name} ({s.value})</span>
                  </div>
                ))}
              </div>
            </TrackedCard>
          </ScrollReveal>

          {/* Overall progress radial */}
          <ScrollReveal delay={0.1}>
            <TrackedCard className="p-5 flex flex-col items-center">
              <p className="font-semibold text-slate-900 text-sm mb-1 self-start">Avg Goal Progress</p>
              <p className="text-xs text-slate-400 mb-2 self-start">On approved & locked goals</p>
              <ResponsiveContainer width="100%" height={160}>
                <RadialBarChart
                  innerRadius="60%" outerRadius="90%"
                  data={[{ value: avgProgress, fill: avgProgress >= 75 ? "#10b981" : avgProgress >= 40 ? "#f59e0b" : "#6366f1" }]}
                  startAngle={210} endAngle={-30}
                >
                  <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "#f1f5f9" }} />
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fontSize={28} fontWeight={700} fill="#1e293b">
                    {avgProgress}%
                  </text>
                  <text x="50%" y="62%" textAnchor="middle" dominantBaseline="middle" fontSize={11} fill="#94a3b8">
                    achievement
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </TrackedCard>
          </ScrollReveal>

          {/* Weightage health card */}
          <ScrollReveal delay={0.15}>
            <TrackedCard className="p-5">
              <p className="font-semibold text-slate-900 text-sm mb-1">Sheet Health</p>
              <p className="text-xs text-slate-400 mb-4">Weightage & readiness</p>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Total Weightage</span>
                    <span className={`font-bold ${weightageOk ? "text-emerald-600" : "text-amber-600"}`}>{totalWeightage}%</span>
                  </div>
                  <AnimatedProgress value={totalWeightage} max={100} color={weightageOk ? "#10b981" : "#f59e0b"} />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Goals Created</span>
                    <span className="font-bold text-indigo-600">{goals.length}/8</span>
                  </div>
                  <AnimatedProgress value={goals.length} max={8} color="#6366f1" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Goals Approved</span>
                    <span className="font-bold text-purple-600">{approvedGoals.length}/{goals.length}</span>
                  </div>
                  <AnimatedProgress value={approvedGoals.length} max={Math.max(goals.length, 1)} color="#8b5cf6" />
                </div>
              </div>
              {weightageOk && approvedGoals.length === 0 && (
                <div className="mt-4 flex items-center gap-2 p-2.5 rounded-xl bg-indigo-50 border border-indigo-100">
                  <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                  <p className="text-xs text-indigo-700">Weightage is perfect! Submit for manager review.</p>
                </div>
              )}
            </TrackedCard>
          </ScrollReveal>
        </div>
      )}

      {/* Goal-by-goal progress list */}
      <ScrollReveal delay={0.2}>
        <TrackedCard className="overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">My Goals</h2>
            <Link href="/employee/goals" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              Manage Goals →
            </Link>
          </div>

          {goals.length === 0 ? (
            <motion.div
              className="flex flex-col items-center py-16"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                <Target className="w-7 h-7 text-indigo-500" />
              </div>
              <p className="font-semibold text-slate-900">No goals yet</p>
              <p className="text-sm text-slate-500 mt-1">Create your first goal to get started</p>
              <PrimaryButton href="/employee/goals" className="mt-4">
                Create Goals
              </PrimaryButton>
            </motion.div>
          ) : (
            <div className="divide-y divide-slate-100">
              {goals.map((goal, i) => {
                const canTrack = goal.status === "APPROVED" || goal.status === "LOCKED"
                const progressColor = goal.progress >= 75 ? "#10b981" : goal.progress >= 40 ? "#f59e0b" : "#6366f1"
                return (
                  <motion.div
                    key={goal.id}
                    className="px-4 sm:px-6 py-4"
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-20px" }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                    whileHover={{ backgroundColor: "rgba(99,102,241,0.03)" }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <p className="font-medium text-sm text-slate-900">{goal.title}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusBadge[goal.status] || ""}`}>
                            {goal.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-400">
                          <span>{goal.thrustArea || "General"}</span>
                          <span>Target: {goal.target} ({goal.uom})</span>
                          <span className="font-semibold text-indigo-600">{goal.weightage}% weight</span>
                        </div>
                        {canTrack && (
                          <div className="mt-2.5">
                            <div className="flex justify-between text-[11px] mb-1">
                              <span className="text-slate-400">Progress</span>
                              <span className="font-bold" style={{ color: progressColor }}>{goal.progress}%</span>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden bg-slate-100">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ background: progressColor }}
                                initial={{ width: 0 }}
                                whileInView={{ width: `${goal.progress}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.7, delay: i * 0.07 }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      {!canTrack && (
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-indigo-600">{goal.weightage}%</p>
                          <p className="text-xs text-slate-400">weight</p>
                        </div>
                      )}
                    </div>
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
