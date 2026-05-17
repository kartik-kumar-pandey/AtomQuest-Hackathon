import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { isGoalSettingOpen, canBypassCycle } from "@/lib/cycle"
import { validateMinWeightage } from "@/lib/goal-utils"

// GET /api/goals - fetch goals for current user (employee) or team (manager)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const employeeId = searchParams.get("employeeId")

  try {
    let goals
    if (session.user.role === "EMPLOYEE") {
      goals = await db.goal.findMany({
        where: { employeeId: session.user.id },
        include: { checkins: true },
        orderBy: { createdAt: "desc" },
      })
    } else if (session.user.role === "MANAGER") {
      // Get all employees under this manager
      const employees = await db.user.findMany({ where: { managerId: session.user.id } })
      const empIds = employees.map(e => e.id)
      const filterEmpId = employeeId && empIds.includes(employeeId) ? employeeId : undefined
      goals = await db.goal.findMany({
        where: { employeeId: filterEmpId ?? { in: empIds } },
        include: { employee: { select: { id: true, name: true, email: true } }, checkins: true },
        orderBy: { createdAt: "desc" },
      })
    } else {
      goals = await db.goal.findMany({
        include: { employee: { select: { id: true, name: true, email: true } }, checkins: true },
        orderBy: { createdAt: "desc" },
      })
    }
    return NextResponse.json(goals)
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// POST /api/goals - create a new goal (employee only)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "EMPLOYEE")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const { title, description, thrustArea, uom, target, weightage } = body

  if (!title || !uom || target == null || weightage == null)
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })

  if (!canBypassCycle(session.user.role) && !isGoalSettingOpen())
    return NextResponse.json({ error: "Goal creation is only allowed during the Goal Setting window (May)." }, { status: 403 })

  const minCheck = validateMinWeightage(Number(weightage))
  if (!minCheck.ok) return NextResponse.json({ error: minCheck.error }, { status: 400 })

  // Validation: max 8 goals
  const existingCount = await db.goal.count({ where: { employeeId: session.user.id } })
  if (existingCount >= 8)
    return NextResponse.json({ error: "Maximum of 8 goals allowed per employee." }, { status: 400 })

  try {
    const goal = await db.goal.create({
      data: {
        employeeId: session.user.id,
        title,
        description: description ?? null,
        thrustArea: thrustArea ?? null,
        uom,
        target: Number(target),
        weightage: Number(weightage),
        status: "DRAFT",
      },
    })
    return NextResponse.json(goal, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 })
  }
}
