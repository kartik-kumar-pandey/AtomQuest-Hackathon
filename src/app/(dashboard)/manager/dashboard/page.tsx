import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { ManagerDashboardView } from "@/components/dashboard/manager-dashboard-view"

export default async function ManagerDashboard() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "MANAGER") redirect("/login")

  const team = await db.user.findMany({
    where: { managerId: session.user.id },
    include: { goals: true },
  })

  const serializedTeam = team.map(emp => ({
    id: emp.id,
    name: emp.name,
    email: emp.email,
    goals: emp.goals.map(g => ({ status: g.status, weightage: g.weightage, progress: g.progress ?? 0 })),
  }))

  return <ManagerDashboardView team={serializedTeam} />
}
