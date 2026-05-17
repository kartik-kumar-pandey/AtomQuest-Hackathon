import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { isGoalSettingOpen, canBypassCycle } from "@/lib/cycle"
import { validateMinWeightage, validateWeightageTotal } from "@/lib/goal-utils"
import { logAudit } from "@/lib/audit"

// PATCH /api/goals/[id] - update goal (submit, approve, reject, edit)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const goal = await db.goal.findUnique({ where: { id } })
  if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 })

  const role = session.user.role

  try {
    // Employee: submit draft goals
    if (role === "EMPLOYEE" && body.action === "submit") {
      if (goal.employeeId !== session.user.id)
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      if (goal.status !== "DRAFT" && goal.status !== "REJECTED")
        return NextResponse.json({ error: "Only DRAFT or REJECTED goals can be submitted" }, { status: 400 })

      if (!canBypassCycle(role) && !isGoalSettingOpen())
        return NextResponse.json({ error: "Goal submission is only allowed during the Goal Setting window (May)." }, { status: 403 })

      // Validate total weightage = 100% across ALL goals on the sheet
      const allGoals = await db.goal.findMany({ where: { employeeId: session.user.id } })
      const weightCheck = validateWeightageTotal(allGoals.map(g => g.weightage))
      if (!weightCheck.ok)
        return NextResponse.json({ error: weightCheck.error }, { status: 400 })

      const updated = await db.goal.update({ where: { id }, data: { status: "SUBMITTED" } })
      await logAudit("Goal", id, session.user.id, "GOAL_SUBMITTED", { status: goal.status }, { status: "SUBMITTED" })
      return NextResponse.json(updated)
    }

    // Employee: edit goal
    if (role === "EMPLOYEE" && body.action === "update") {
      if (goal.employeeId !== session.user.id)
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      if (goal.status === "LOCKED")
        return NextResponse.json({ error: "Locked goals cannot be edited. Contact Admin to unlock." }, { status: 400 })

      const { title, description, thrustArea, uom, target, weightage } = body
      const minCheck = validateMinWeightage(Number(weightage))
      if (!minCheck.ok) return NextResponse.json({ error: minCheck.error }, { status: 400 })

      const isShared = await db.sharedGoal.findFirst({ where: { employeeGoalId: id } })

      if (goal.status === "APPROVED" || goal.status === "SUBMITTED" || isShared) {
        const titleMismatch = (title || "").trim() !== (goal.title || "").trim()
        const targetMismatch = Number(target) !== goal.target
        const uomMismatch = uom !== goal.uom
        const thrustAreaMismatch = (thrustArea || null) !== (goal.thrustArea || null)

        if (titleMismatch || targetMismatch || uomMismatch || thrustAreaMismatch) {
          return NextResponse.json({
            error: isShared
              ? "This is a Shared Goal. Title, Target, UoM, and Thrust Area are read-only. You can adjust weightage only."
              : "This goal is approved/submitted. Title, Target, UoM, and Thrust Area are read-only. You can adjust weightage only to balance your sheet.",
          }, { status: 400 })
        }
      } else if (!canBypassCycle(role) && !isGoalSettingOpen()) {
        return NextResponse.json({ error: "Goal edits are only allowed during the Goal Setting window (May)." }, { status: 403 })
      }

      const oldVal = { title: goal.title, target: goal.target, weightage: goal.weightage, uom: goal.uom }
      const updated = await db.goal.update({
        where: { id },
        data: { title, description, thrustArea, uom, target: Number(target), weightage: Number(weightage) },
      })

      if (goal.status === "APPROVED" || goal.status === "SUBMITTED" || isShared) {
        await logAudit("Goal", id, session.user.id, "GOAL_EDITED", oldVal, { title: updated.title, target: updated.target, weightage: updated.weightage, uom: updated.uom })
      }

      return NextResponse.json(updated)
    }

    // Manager: approve, reject, inline edit, or approve all for employee
    if (role === "MANAGER") {
      const employee = await db.user.findUnique({ where: { id: goal.employeeId } })
      if (!employee || employee.managerId !== session.user.id)
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })

      if (body.action === "approve-all") {
        const employeeId = body.employeeId as string
        if (!employeeId) return NextResponse.json({ error: "employeeId required" }, { status: 400 })

        const submitted = await db.goal.findMany({
          where: { employeeId, status: "SUBMITTED" },
        })
        if (submitted.length === 0)
          return NextResponse.json({ error: "No submitted goals for this employee" }, { status: 400 })

        const allGoals = await db.goal.findMany({ where: { employeeId } })
        const weightCheck = validateWeightageTotal(allGoals.map(g => g.weightage))
        if (!weightCheck.ok)
          return NextResponse.json({ error: weightCheck.error }, { status: 400 })

        const updated = []
        for (const g of submitted) {
          const result = await db.goal.update({ where: { id: g.id }, data: { status: "LOCKED" } })
          await logAudit("Goal", g.id, session.user.id, "GOAL_LOCKED", { status: g.status }, { status: "LOCKED" })
          updated.push(result)
        }
        return NextResponse.json({ success: true, count: updated.length, goals: updated })
      }

      if (body.action === "approve") {
        const old = { status: goal.status }
        const updated = await db.goal.update({ where: { id }, data: { status: "LOCKED" } })
        await logAudit("Goal", id, session.user.id, "GOAL_LOCKED", old, { status: "LOCKED" })
        return NextResponse.json(updated)
      }

      if (body.action === "reject") {
        const updated = await db.goal.update({ where: { id }, data: { status: "REJECTED" } })
        await logAudit("Goal", id, session.user.id, "GOAL_REJECTED", { status: goal.status }, { status: "REJECTED" })
        return NextResponse.json(updated)
      }

      if (body.action === "edit") {
        const oldVal = { target: goal.target, weightage: goal.weightage }
        const updated = await db.goal.update({
          where: { id },
          data: {
            target: body.target != null ? Number(body.target) : goal.target,
            weightage: body.weightage != null ? Number(body.weightage) : goal.weightage,
          },
        })
        await logAudit("Goal", id, session.user.id, "GOAL_EDITED", oldVal, { target: updated.target, weightage: updated.weightage })
        return NextResponse.json(updated)
      }
    }

    // Admin: lock/unlock
    if (role === "ADMIN") {
      if (body.action === "lock") {
        const updated = await db.goal.update({ where: { id }, data: { status: "LOCKED" } })
        await logAudit("Goal", id, session.user.id, "ADMIN_LOCK", { status: goal.status }, { status: "LOCKED" })
        return NextResponse.json(updated)
      }
      if (body.action === "unlock") {
        const updated = await db.goal.update({ where: { id }, data: { status: "APPROVED" } })
        await logAudit("Goal", id, session.user.id, "ADMIN_UNLOCK", { status: goal.status }, { status: "APPROVED" })
        return NextResponse.json(updated)
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// DELETE /api/goals/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const goal = await db.goal.findUnique({ where: { id } })
  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (goal.employeeId !== session.user.id || goal.status !== "DRAFT")
    return NextResponse.json({ error: "Cannot delete this goal" }, { status: 403 })

  if (!canBypassCycle(session.user.role) && !isGoalSettingOpen())
    return NextResponse.json({ error: "Goal deletion is only allowed during the Goal Setting window (May)." }, { status: 403 })

  await db.goal.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
