import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { nvidiaChat, parseJsonFromModel } from "@/lib/nvidia-ai"

export const maxDuration = 60

const THRUST_AREAS = ["Engineering", "Sales", "Operations", "Finance", "HR", "Marketing", "Product", "Customer Success", "General"]
const UOMS = ["MIN", "MAX", "TIMELINE", "ZERO"]

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "EMPLOYEE") {
    return NextResponse.json({ error: "Only employees can use goal suggestions" }, { status: 403 })
  }

  try {
    const { prompt, currentWeightage = 0, goalCount = 0 } = await req.json()
    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Describe what you want to achieve" }, { status: 400 })
    }

    const remaining = Math.max(0, 100 - Number(currentWeightage))
    const maxW = Math.min(remaining || 30, 40)

    const system = `Return ONLY JSON: {"title":"","description":"","thrustArea":"","uom":"MIN|MAX|TIMELINE|ZERO","target":0,"weightage":10}
thrustArea: ${THRUST_AREAS.join("|")}. weightage: integer 10-${maxW}. SMART, measurable. No markdown.`

    const user = `Name: ${session.user.name}. Goals: ${goalCount}, used ${currentWeightage}%, left ~${remaining}%. Topic: ${prompt.trim()}`

    const raw = await nvidiaChat(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      {
        maxTokens: 350,
        temperature: 0.15,
        timeoutMs: 22000,
      },
    )

    const parsed = parseJsonFromModel<{
      title: string
      description?: string
      thrustArea?: string
      uom: string
      target: number
      weightage: number
    }>(raw)

    const uom = UOMS.includes(parsed.uom) ? parsed.uom : "MIN"
    const thrustArea = THRUST_AREAS.includes(parsed.thrustArea ?? "")
      ? parsed.thrustArea
      : "General"
    const weightage = Math.min(maxW, Math.max(10, Math.round(Number(parsed.weightage) || 10)))

    return NextResponse.json({
      title: String(parsed.title).slice(0, 200),
      description: String(parsed.description ?? "").slice(0, 500),
      thrustArea,
      uom,
      target: Number(parsed.target) || 1,
      weightage,
    })
  } catch (err) {
    console.error("[ai/suggest-goal]", err)
    const message = err instanceof Error ? err.message : "AI request failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
