import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, confirmPassword } = body

    if (!name?.trim() || !email?.trim() || !password)
      return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 })

    if (password.length < 6)
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 })

    if (password !== confirmPassword)
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 })

    const normalizedEmail = email.trim().toLowerCase()

    const existing = await db.user.findUnique({ where: { email: normalizedEmail } })
    if (existing)
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 400 })

    // Assign new employees to first available manager
    const defaultManager = await db.user.findFirst({ where: { role: "MANAGER" } })

    const hashed = await bcrypt.hash(password, 10)
    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashed,
        role: "EMPLOYEE",
        managerId: defaultManager?.id ?? null,
      },
      select: { id: true, name: true, email: true, role: true },
    })

    return NextResponse.json({ success: true, user }, { status: 201 })
  } catch (err) {
    console.error("[signup]", err)
    const message =
      err instanceof Error && err.message.includes("DATABASE_URL")
        ? "Database is not configured. Contact your administrator."
        : err instanceof Error &&
            (err.message.includes("does not exist") || err.message.includes("relation"))
          ? "Database tables are missing. Run: npm run db:setup"
          : "Could not create account. Please try again."
    return NextResponse.json(
      {
        error: message,
        ...(process.env.NODE_ENV === "development" && err instanceof Error
          ? { detail: err.message }
          : {}),
      },
      { status: 500 },
    )
  }
}
