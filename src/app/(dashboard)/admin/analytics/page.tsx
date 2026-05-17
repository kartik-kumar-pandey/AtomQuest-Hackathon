import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import AnalyticsCharts from "@/app/(dashboard)/admin/analytics/charts"

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") redirect("/login")

  const [goals, users, checkins] = await Promise.all([
    db.goal.findMany({ include: { employee: { select: { name: true } }, checkins: true } }),
    db.user.findMany({ select: { id: true, name: true, role: true, managerId: true } }),
    db.checkin.findMany({ include: { goal: { select: { title: true, uom: true, target: true, weightage: true, employee: { select: { name: true } } } } } }),
  ])

  // Goal status distribution
  const statusDist = ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "LOCKED"].map(s => ({
    name: s,
    value: goals.filter(g => g.status === s).length,
  }))

  // UoM distribution
  const uomDist = ["MIN", "MAX", "TIMELINE", "ZERO"].map(u => ({
    name: u,
    value: goals.filter(g => g.uom === u).length,
  }))

  // Thrust area distribution
  const thrustMap: Record<string, number> = {}
  goals.forEach(g => {
    const area = g.thrustArea || "General"
    thrustMap[area] = (thrustMap[area] || 0) + 1
  })
  const thrustDist = Object.entries(thrustMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8)

  // Quarterly check-in completion
  const quarterDist = ["Q1", "Q2", "Q3", "Q4"].map(q => ({
    quarter: q,
    checkins: checkins.filter(c => c.quarter === q).length,
    onTrack: checkins.filter(c => c.quarter === q && c.status === "ON_TRACK").length,
    completed: checkins.filter(c => c.quarter === q && c.status === "COMPLETED").length,
  }))

  // Per-employee goal counts
  const employees = users.filter(u => u.role === "EMPLOYEE")
  const empGoalData = employees.map(emp => ({
    name: emp.name.split(" ")[0],
    goals: goals.filter(g => g.employee.name === emp.name).length,
    approved: goals.filter(g => g.employee.name === emp.name && (g.status === "APPROVED" || g.status === "LOCKED")).length,
  })).filter(e => e.goals > 0)

  const totalGoals = goals.length
  const approvalRate = totalGoals > 0 ? Math.round((goals.filter(g => g.status === "APPROVED" || g.status === "LOCKED").length / totalGoals) * 100) : 0
  const checkInRate = totalGoals > 0 ? Math.round((checkins.length / (totalGoals * 4)) * 100) : 0

  return (
    <AnalyticsCharts
      statusDist={statusDist}
      uomDist={uomDist}
      thrustDist={thrustDist}
      quarterDist={quarterDist}
      empGoalData={empGoalData}
      totalGoals={totalGoals}
      approvalRate={approvalRate}
      checkInRate={checkInRate}
      totalUsers={users.length}
      totalCheckins={checkins.length}
    />
  )
}
