"use client"

import Link from "next/link"
import { Users, ClipboardList, CheckCircle, Clock } from "lucide-react"
import { PageShell, PageHeader, StatCard, TrackedCard, PrimaryButton } from "@/components/ui/tracked"
import { ScrollReveal, StaggerGrid, StaggerItem } from "@/components/ui/motion"
import { motion } from "framer-motion"

type TeamMember = {
  id: string
  name: string
  email: string
  goals: { status: string; weightage: number }[]
}

export function ManagerDashboardView({ team }: { team: TeamMember[] }) {
  const pendingApprovals = team.flatMap(emp => emp.goals.filter(g => g.status === "SUBMITTED"))
  const approvedGoals = team.flatMap(emp => emp.goals.filter(g => g.status === "APPROVED" || g.status === "LOCKED"))
  const totalGoals = team.flatMap(emp => emp.goals)

  const stats = [
    { label: "Team Members", value: team.length, icon: Users, color: "#6366f1" },
    { label: "Pending Approvals", value: pendingApprovals.length, icon: Clock, color: "#f59e0b" },
    { label: "Approved Goals", value: approvedGoals.length, icon: CheckCircle, color: "#10b981" },
    { label: "Total Goals", value: totalGoals.length, icon: ClipboardList, color: "#8b5cf6" },
  ]

  return (
    <PageShell>
      <PageHeader title="Team Dashboard" subtitle="Manage your team's goals and quarterly check-ins" />

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
                const totalW = emp.goals.reduce((s, g) => s + g.weightage, 0)
                return (
                  <motion.div
                    key={emp.id}
                    className="px-4 sm:px-6 py-4 flex flex-col lg:flex-row lg:items-center gap-4"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ backgroundColor: "rgba(99,102,241,0.04)" }}
                  >
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
                    <div className="grid grid-cols-4 gap-4 text-center">
                      {[
                        { v: emp.goals.length, l: "Goals", c: "text-slate-900" },
                        { v: submitted, l: "Pending", c: "text-amber-600" },
                        { v: approved, l: "Approved", c: "text-emerald-600" },
                        { v: `${totalW}%`, l: "Weight", c: Math.round(totalW) === 100 ? "text-emerald-600" : "text-amber-600" },
                      ].map((cell, j) => (
                        <motion.div
                          key={cell.l}
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.06 + j * 0.04 }}
                        >
                          <p className={`font-bold text-lg ${cell.c}`}>{cell.v}</p>
                          <p className="text-xs text-slate-400">{cell.l}</p>
                        </motion.div>
                      ))}
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
