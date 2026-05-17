import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role === "EMPLOYEE")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const { masterGoalId, employeeIds, title, description, thrustArea, uom, target } = body

  if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0)
    return NextResponse.json({ error: "Missing recipient employeeIds" }, { status: 400 })

  let masterGoal
  try {
    if (masterGoalId) {
      masterGoal = await db.goal.findUnique({ where: { id: masterGoalId } })
      if (!masterGoal) return NextResponse.json({ error: "Master Goal not found" }, { status: 404 })
    } else {
      if (!title || !uom || target == null)
        return NextResponse.json({ error: "Missing required goal fields" }, { status: 400 })

      masterGoal = await db.goal.create({
        data: {
          employeeId: session.user.id,
          title,
          description: description || null,
          thrustArea: thrustArea || null,
          uom,
          target: Number(target),
          weightage: 0, // Master KPIs have 0% weightage on the creator's sheet
          status: "APPROVED",
        },
      })
    }

    const results = []
    for (const empId of employeeIds) {
      // Check if recipient has less than 8 goals
      const existingCount = await db.goal.count({ where: { employeeId: empId } })
      if (existingCount >= 8) {
        // Skip or return error. Let's skip to be robust, or return a message.
        continue
      }

      // Create goal copy for employee
      const copiedGoal = await db.goal.create({
        data: {
          employeeId: empId,
          title: masterGoal.title,
          description: masterGoal.description,
          thrustArea: masterGoal.thrustArea,
          uom: masterGoal.uom,
          target: masterGoal.target,
          weightage: 10, // Default minimum weightage
          status: "APPROVED", // Auto-approved since manager/admin pushes it
        },
      })

      // Register link
      await db.sharedGoal.create({
        data: {
          masterGoalId: masterGoal.id,
          employeeGoalId: copiedGoal.id,
          primaryOwnerId: masterGoal.employeeId,
        },
      })

      results.push(copiedGoal)
    }

    return NextResponse.json({ success: true, count: results.length })
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const shared = await db.sharedGoal.findMany()
  return NextResponse.json(shared)
}
