import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { isCheckinOpen, canBypassCycle } from "@/lib/cycle"
import { logAudit } from "@/lib/audit"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { goalId, quarter, achievement, status, comment } = body

  if (!goalId || !quarter || achievement == null || !status)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  if (!canBypassCycle(session.user.role) && !isCheckinOpen(quarter))
    return NextResponse.json({
      error: `Check-ins for ${quarter} are only allowed during the ${quarter} window. See the cycle schedule in Admin Settings.`,
    }, { status: 403 })

  const goal = await db.goal.findUnique({ where: { id: goalId } })
  if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 })

  if (goal.status !== "APPROVED" && goal.status !== "LOCKED")
    return NextResponse.json({ error: "Check-ins are only allowed for approved/locked goals" }, { status: 400 })

  if (session.user.role === "EMPLOYEE" && goal.employeeId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const existing = await db.checkin.findUnique({
    where: { goalId_quarter: { goalId, quarter } } as { goalId_quarter: { goalId: string; quarter: string } },
  })

  const checkin = await db.checkin.upsert({
    where: { goalId_quarter: { goalId, quarter } } as { goalId_quarter: { goalId: string; quarter: string } },
    update: { achievement: Number(achievement), status, comment: comment ?? null },
    create: {
      goalId,
      quarter,
      achievement: Number(achievement),
      status,
      comment: comment ?? null,
    },
  })

  await logAudit(
    "Checkin",
    checkin.id,
    session.user.id,
    "CHECKIN_UPDATED",
    existing ? { achievement: existing.achievement, status: existing.status, quarter } : { quarter },
    { achievement: checkin.achievement, status: checkin.status, quarter },
  )

  // Sync Engine: If this is the master goal, sync to all linked goals
  const sharedGoals = await db.sharedGoal.findMany({ where: { masterGoalId: goalId } })
  for (const sg of sharedGoals) {
    await db.checkin.upsert({
      where: { goalId_quarter: { goalId: sg.employeeGoalId, quarter } } as { goalId_quarter: { goalId: string; quarter: string } },
      update: { achievement: Number(achievement), status, comment: `Synced: ${comment ?? ""}` },
      create: {
        goalId: sg.employeeGoalId,
        quarter,
        achievement: Number(achievement),
        status,
        comment: `Synced: ${comment ?? ""}`,
      },
    })
  }

  return NextResponse.json(checkin, { status: 201 })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const goalId = searchParams.get("goalId")

  let checkins
  if (session.user.role === "EMPLOYEE") {
    checkins = await db.checkin.findMany({
      where: goalId
        ? { goalId }
        : { goal: { employeeId: session.user.id } },
      include: { goal: { select: { title: true, target: true, uom: true, weightage: true } } },
      orderBy: { createdAt: "desc" },
    })
  } else if (session.user.role === "MANAGER") {
    const employees = await db.user.findMany({ where: { managerId: session.user.id } })
    const empIds = employees.map(e => e.id)
    checkins = await db.checkin.findMany({
      where: goalId
        ? { goalId }
        : { goal: { employeeId: { in: empIds } } },
      include: {
        goal: {
          select: {
            title: true, target: true, uom: true, weightage: true,
            employee: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  } else {
    checkins = await db.checkin.findMany({
      where: goalId ? { goalId } : undefined,
      include: {
        goal: {
          select: {
            title: true, target: true, uom: true, weightage: true,
            employee: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  }

  return NextResponse.json(checkins)
}
