import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { logAudit } from "@/lib/audit"

// Manager adds check-in comment
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const { checkinId, managerComment } = body

  if (!checkinId) return NextResponse.json({ error: "checkinId required" }, { status: 400 })

  const checkin = await db.checkin.findUnique({
    where: { id: checkinId },
    include: { goal: { select: { employeeId: true } } },
  })
  if (!checkin) return NextResponse.json({ error: "Check-in not found" }, { status: 404 })

  const employee = await db.user.findUnique({ where: { id: checkin.goal.employeeId } })
  if (!employee || employee.managerId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const updated = await db.checkin.update({
    where: { id: checkinId },
    data: { managerComment },
  })

  await logAudit(
    "Checkin",
    checkinId,
    session.user.id,
    "MANAGER_COMMENT",
    { managerComment: checkin.managerComment },
    { managerComment },
  )

  return NextResponse.json(updated)
}
