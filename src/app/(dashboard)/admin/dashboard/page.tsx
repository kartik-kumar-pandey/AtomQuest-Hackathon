import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getActivePhase } from "@/lib/cycle"
import { AdminDashboardView } from "@/components/dashboard/admin-dashboard-view"

export const dynamic = "force-dynamic"

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") redirect("/login")

  const [totalUsers, totalGoals, totalCheckins, auditLogCount, recentAuditLogs, recentGoals, employees, managers] = await Promise.all([
    db.user.count(),
    db.goal.count(),
    db.checkin.count(),
    db.auditLog.count(),
    db.auditLog.findMany({
      take: 8,
      orderBy: { timestamp: "desc" },
    }),
    db.goal.findMany({
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: { employee: { select: { name: true } } },
    }),
    db.user.findMany({
      where: { role: "EMPLOYEE" },
      include: {
        goals: { where: { status: { in: ["APPROVED", "LOCKED"] } }, include: { checkins: true } },
        manager: { select: { name: true } },
      },
    }),
    db.user.findMany({
      where: { role: "MANAGER" },
      include: {
        employees: {
          include: {
            goals: {
              where: { status: { in: ["APPROVED", "LOCKED"] } },
              include: { checkins: true },
            },
          },
        },
      },
    }),
  ])

  const activePhase = getActivePhase()
  const activeQuarter = activePhase?.id?.startsWith("Q") ? activePhase.id : "Q1"

  const employeeCompletion = employees.map(emp => {
    const goalCount = emp.goals.length
    const checkinsDone = emp.goals.filter(g => g.checkins.some(c => c.quarter === activeQuarter)).length
    const avgProgress = goalCount > 0
      ? Math.round(emp.goals.reduce((s, g) => s + (g.progress ?? 0), 0) / goalCount)
      : 0
    return {
      name: emp.name,
      email: emp.email,
      manager: emp.manager?.name ?? "—",
      goalCount,
      checkinsDone,
      avgProgress,
      complete: goalCount > 0 && checkinsDone >= goalCount,
    }
  })

  const managerCompletion = managers.map(mgr => {
    const teamGoals = mgr.employees.flatMap(e => e.goals)
    const reviewed = teamGoals.filter(g =>
      g.checkins.some(c => c.quarter === activeQuarter && c.managerComment),
    ).length
    const total = teamGoals.filter(g =>
      g.checkins.some(c => c.quarter === activeQuarter),
    ).length
    return {
      name: mgr.name,
      teamSize: mgr.employees.length,
      reviewed,
      total,
      complete: total > 0 && reviewed >= total,
    }
  })

  const goalsByStatus = await db.goal.groupBy({
    by: ["status"],
    _count: { status: true },
  })

  const statusMap = Object.fromEntries(goalsByStatus.map(g => [g.status, g._count.status]))

  const stats = [
    { label: "Total Users", value: totalUsers, icon: "users" as const, color: "#6366f1" },
    { label: "Total Goals", value: totalGoals, icon: "target" as const, color: "#0ea5e9" },
    { label: "Check-ins Logged", value: totalCheckins, icon: "checkCircle" as const, color: "#10b981" },
    { label: "Audit Events", value: auditLogCount, icon: "shield" as const, color: "#f59e0b" },
  ]

  const goalStatuses = [
    { label: "Draft", count: statusMap["DRAFT"] || 0, color: "#94a3b8" },
    { label: "Submitted", count: statusMap["SUBMITTED"] || 0, color: "#f59e0b" },
    { label: "Approved", count: statusMap["APPROVED"] || 0, color: "#10b981" },
    { label: "Rejected", count: statusMap["REJECTED"] || 0, color: "#ef4444" },
    { label: "Locked", count: statusMap["LOCKED"] || 0, color: "#6366f1" },
  ]

  const auditGoalIds = recentAuditLogs.filter(l => l.entityType === "Goal").map(l => l.entityId)
  const auditGoals = await db.goal.findMany({
    where: { id: { in: auditGoalIds } },
    select: { id: true, title: true, status: true, employee: { select: { name: true } } },
  })
  const auditGoalMap = Object.fromEntries(auditGoals.map(g => [g.id, g]))

  const auditUserIds = [...new Set(recentAuditLogs.map(l => l.changedBy))]
  const auditUsers = await db.user.findMany({ where: { id: { in: auditUserIds } }, select: { id: true, name: true } })
  const auditUserMap = Object.fromEntries(auditUsers.map(u => [u.id, u.name]))

  return (
    <AdminDashboardView
      activePhaseLabel={activePhase ? `${activePhase.period} (${activePhase.window})` : undefined}
      stats={stats}
      goalStatuses={goalStatuses}
      totalGoals={totalGoals}
      employeeCompletion={employeeCompletion}
      managerCompletion={managerCompletion}
      activeQuarter={activeQuarter}
      recentAuditLogs={recentAuditLogs.map(l => ({
        ...l,
        timestamp: l.timestamp.toISOString(),
      }))}
      auditGoalMap={auditGoalMap}
      auditUserMap={auditUserMap}
      recentGoals={recentGoals.map(g => ({
        ...g,
        updatedAt: g.updatedAt.toISOString(),
      }))}
    />
  )
}
