import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role === "EMPLOYEE")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  let goals
  if (session.user.role === "MANAGER") {
    const employees = await db.user.findMany({ where: { managerId: session.user.id } })
    const empIds = employees.map(e => e.id)
    goals = await db.goal.findMany({
      where: { employeeId: { in: empIds } },
      include: { employee: { select: { name: true, email: true } }, checkins: true },
      orderBy: { createdAt: "desc" },
    })
  } else {
    goals = await db.goal.findMany({
      include: { employee: { select: { name: true, email: true } }, checkins: true },
      orderBy: { createdAt: "desc" },
    })
  }

  // Build CSV
  const rows = [["Employee", "Email", "Goal Title", "Thrust Area", "UoM", "Target", "Weightage", "Status", "Q1 Achievement", "Q2 Achievement", "Q3 Achievement", "Q4 Achievement"]]

  for (const goal of goals) {
    const q: Record<string, number | string> = {}
    goal.checkins.forEach(c => { q[c.quarter] = c.achievement })
    rows.push([
      goal.employee.name,
      goal.employee.email,
      goal.title,
      goal.thrustArea || "General",
      goal.uom,
      String(goal.target),
      String(goal.weightage) + "%",
      goal.status,
      String(q["Q1"] ?? ""),
      String(q["Q2"] ?? ""),
      String(q["Q3"] ?? ""),
      String(q["Q4"] ?? ""),
    ])
  }

  const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n")

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="atomquest-achievement-report-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
