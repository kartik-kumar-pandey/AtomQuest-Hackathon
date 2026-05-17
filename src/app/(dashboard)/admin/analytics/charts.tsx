"use client"

import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts"
import { TrendingUp, Users, Target, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"
import { PageShell, PageHeader, StatCard, TrackedCard } from "@/components/ui/tracked"
import { ScrollReveal, StaggerGrid, StaggerItem } from "@/components/ui/motion"

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#0ea5e9", "#8b5cf6", "#14b8a6", "#f97316"]

const chartMotion = {
  initial: { opacity: 0, y: 24, scale: 0.98 },
  whileInView: { opacity: 1, y: 0, scale: 1 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
}

const tooltipStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  boxShadow: "0 8px 24px rgba(99,102,241,0.12)",
  color: "#0f172a",
  fontSize: "12px",
}

type Props = {
  statusDist: { name: string; value: number }[]
  uomDist: { name: string; value: number }[]
  thrustDist: { name: string; value: number }[]
  quarterDist: { quarter: string; checkins: number; onTrack: number; completed: number }[]
  empGoalData: { name: string; goals: number; approved: number }[]
  totalGoals: number
  approvalRate: number
  checkInRate: number
  totalUsers: number
  totalCheckins: number
}

export default function AnalyticsCharts(props: Props) {
  const {
    statusDist, uomDist, thrustDist, quarterDist,
    empGoalData, totalGoals, approvalRate, checkInRate, totalUsers,
  } = props

  const kpis = [
    { label: "Total Goals", value: totalGoals, icon: Target, color: "#6366f1", sub: "Across all employees" },
    { label: "Approval Rate", value: `${approvalRate}%`, icon: CheckCircle, color: "#10b981", sub: "Goals approved" },
    { label: "Check-in Rate", value: `${checkInRate}%`, icon: TrendingUp, color: "#f59e0b", sub: "Of possible slots filled" },
    { label: "Total Users", value: totalUsers, icon: Users, color: "#0ea5e9", sub: "Employees & managers" },
  ]

  const maxThrust = Math.max(...thrustDist.map(t => t.value), 1)

  return (
    <PageShell>
      <PageHeader title="Analytics" subtitle="Organization-wide goal tracking insights" />

      <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {kpis.map((k, i) => (
          <StaggerItem key={k.label}>
            <StatCard label={k.label} value={k.value} icon={k.icon} color={k.color} sub={k.sub} index={i} />
          </StaggerItem>
        ))}
      </StaggerGrid>

      <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ScrollReveal>
          <motion.div {...chartMotion}>
            <TrackedCard className="p-5">
              <h2 className="font-semibold text-slate-900 mb-5">Goal Status Distribution</h2>
              {totalGoals === 0 ? (
                <div className="h-48 flex items-center justify-center text-sm text-slate-500">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={statusDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={64}
                      outerRadius={96}
                      paddingAngle={4}
                      dataKey="value"
                      animationDuration={1200}
                      animationEasing="ease-out"
                    >
                      {statusDist.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-slate-600 text-xs">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </TrackedCard>
          </motion.div>
        </ScrollReveal>

        <ScrollReveal delay={0.08}>
          <motion.div {...chartMotion} transition={{ ...chartMotion.transition, delay: 0.08 }}>
            <TrackedCard className="p-5">
              <h2 className="font-semibold text-slate-900 mb-5">Goal Type (UoM) Breakdown</h2>
              {totalGoals === 0 ? (
                <div className="h-48 flex items-center justify-center text-sm text-slate-500">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={uomDist} barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(99,102,241,0.08)" }} />
                    <Bar dataKey="value" name="Goals" radius={[8, 8, 0, 0]} animationDuration={1000} animationEasing="ease-out">
                      {uomDist.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </TrackedCard>
          </motion.div>
        </ScrollReveal>
      </motion.div>

      <motion.div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <ScrollReveal delay={0.1} className="xl:col-span-2">
          <motion.div {...chartMotion}>
            <TrackedCard className="p-5">
              <h2 className="font-semibold text-slate-900 mb-5">Quarterly Check-in Activity</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={quarterDist} barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="quarter" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(99,102,241,0.08)" }} />
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-slate-600 text-xs">{v}</span>} />
                  <Bar dataKey="checkins" name="Total Check-ins" fill="#6366f1" radius={[6, 6, 0, 0]} animationDuration={900} />
                  <Bar dataKey="onTrack" name="On Track" fill="#f59e0b" radius={[6, 6, 0, 0]} animationDuration={1000} />
                  <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[6, 6, 0, 0]} animationDuration={1100} />
                </BarChart>
              </ResponsiveContainer>
            </TrackedCard>
          </motion.div>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <motion.div {...chartMotion}>
            <TrackedCard className="p-5 h-full">
              <h2 className="font-semibold text-slate-900 mb-4">Goals by Thrust Area</h2>
              {thrustDist.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-sm text-slate-500">No data yet</div>
              ) : (
                <div className="space-y-3">
                  {thrustDist.map(({ name, value }, i) => (
                    <motion.div
                      key={name}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.06 }}
                    >
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-medium text-slate-700 truncate">{name}</span>
                        <span className="text-xs font-bold ml-2 shrink-0" style={{ color: COLORS[i % COLORS.length] }}>{value}</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden bg-slate-100">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: COLORS[i % COLORS.length] }}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${(value / maxThrust) * 100}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TrackedCard>
          </motion.div>
        </ScrollReveal>
      </motion.div>

      {empGoalData.length > 0 && (
        <ScrollReveal delay={0.2}>
          <motion.div {...chartMotion}>
            <TrackedCard className="p-5">
              <h2 className="font-semibold text-slate-900 mb-5">Employee Goal Completion</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={empGoalData} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(99,102,241,0.08)" }} />
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-slate-600 text-xs">{v}</span>} />
                  <Bar dataKey="goals" name="Total Goals" fill="#6366f1" radius={[6, 6, 0, 0]} animationDuration={900} />
                  <Bar dataKey="approved" name="Approved" fill="#10b981" radius={[6, 6, 0, 0]} animationDuration={1100} />
                </BarChart>
              </ResponsiveContainer>
            </TrackedCard>
          </motion.div>
        </ScrollReveal>
      )}
    </PageShell>
  )
}
