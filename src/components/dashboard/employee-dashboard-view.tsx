"use client"

import Link from "next/link"
import { Target, TrendingUp, CheckCircle, Clock, AlertCircle, Plus } from "lucide-react"
import { computeScore } from "@/lib/goal-utils"
import { PageShell, PageHeader, StatCard, TrackedCard, PrimaryButton, AnimatedProgress, statusBadge } from "@/components/ui/tracked"
import { ScrollReveal, StaggerGrid, StaggerItem } from "@/components/ui/motion"
import { motion } from "framer-motion"

type Goal = {
  id: string
  title: string
  thrustArea: string | null
  uom: string
  target: number
  weightage: number
  status: string
  checkins: { achievement: number; createdAt: Date | string }[]
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

  let overallScore = 0
  for (const goal of approvedGoals) {
    const latest = [...goal.checkins].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0]
    if (latest) {
      overallScore += computeScore(goal.uom, goal.target, latest.achievement) * (goal.weightage / 100)
    }
  }

  const stats = [
    { label: "Total Goals", value: goals.length, sub: "Max 8", icon: Target, color: "#6366f1" },
    { label: "Overall Score", value: `${overallScore.toFixed(1)}%`, sub: "Weighted avg", icon: TrendingUp, color: "#10b981" },
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

      <ScrollReveal delay={0.1}>
        <TrackedCard className="overflow-hidden">
          <motion.div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-100"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="font-semibold text-slate-900">Goal Sheet</h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">Weightage</span>
              <div className="w-32">
                <AnimatedProgress value={totalWeightage} max={100} color={weightageOk ? "#10b981" : "#f59e0b"} />
              </div>
              <span className="text-xs font-bold text-indigo-600">{totalWeightage}%</span>
            </div>
          </motion.div>

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
                const latest = [...goal.checkins].sort(
                  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                )[0]
                const score = latest ? computeScore(goal.uom, goal.target, latest.achievement) : null
                return (
                  <motion.div
                    key={goal.id}
                    className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4"
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-20px" }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                    whileHover={{ backgroundColor: "rgba(99,102,241,0.03)" }}
                  >
                    <motion.div className="flex-1 min-w-0" layout>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="font-medium text-sm text-slate-900">{goal.title}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusBadge[goal.status] || ""}`}>
                          {goal.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>{goal.thrustArea || "General"}</span>
                        <span>UoM: {goal.uom}</span>
                        <span>Target: {goal.target}</span>
                        {latest && <span>Achievement: {latest.achievement}</span>}
                      </div>
                    </motion.div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      {score !== null && (
                        <div className="w-28">
                          <div className="flex justify-between mb-1">
                            <span className="text-xs text-slate-400">Score</span>
                            <span className="text-xs font-semibold text-emerald-600">{score.toFixed(0)}%</span>
                          </div>
                          <AnimatedProgress value={score} delay={i * 0.05 + 0.2} color="#10b981" />
                        </div>
                      )}
                      <div className="text-right">
                        <p className="text-sm font-bold text-indigo-600">{goal.weightage}%</p>
                        <p className="text-xs text-slate-400">weight</p>
                      </div>
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
