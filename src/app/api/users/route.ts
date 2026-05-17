import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const where = session.user.role === "MANAGER" ? { role: "EMPLOYEE" } : undefined

  const users = await db.user.findMany({
    where,
    select: { id: true, name: true, email: true, role: true, managerId: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { name, email, role, managerId } = await req.json()
  const bcrypt = await import("bcryptjs")
  const password = await bcrypt.default.hash("password", 10)

  try {
    const user = await db.user.create({
      data: { name, email, password, role: role ?? "EMPLOYEE", managerId: managerId || null },
    })
    return NextResponse.json(user, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Email already exists" }, { status: 400 })
  }
}
