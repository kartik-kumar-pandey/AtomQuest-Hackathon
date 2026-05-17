import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { EmployeeDashboardView } from "@/components/dashboard/employee-dashboard-view"

export default async function EmployeeDashboard() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "EMPLOYEE") redirect("/login")

  const goals = await db.goal.findMany({
    where: { employeeId: session.user.id },
    include: { checkins: true },
    orderBy: { createdAt: "desc" },
  })

  const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0)

  const serializedGoals = goals.map(g => ({
    id: g.id,
    title: g.title,
    thrustArea: g.thrustArea,
    uom: g.uom,
    target: g.target,
    weightage: g.weightage,
    status: g.status,
    checkins: g.checkins.map(c => ({
      achievement: c.achievement,
      createdAt: c.createdAt.toISOString(),
    })),
  }))

  return (
    <EmployeeDashboardView
      userName={session.user.name ?? "there"}
      goals={serializedGoals}
      totalWeightage={totalWeightage}
    />
  )
}
