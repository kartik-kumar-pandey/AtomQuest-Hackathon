import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { nvidiaChat } from "@/lib/nvidia-ai"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "EMPLOYEE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { goals, totalWeightage } = await req.json()
    if (!Array.isArray(goals) || goals.length === 0) {
      return NextResponse.json({ error: "Add at least one goal first" }, { status: 400 })
    }

    const list = goals
      .map((g: { title: string; weightage: number; status: string }) =>
        `- ${g.title} (${g.weightage}%, ${g.status})`,
      )
      .join("\n")

    const text = await nvidiaChat(
      [
        {
          role: "system",
          content:
            "You help employees balance performance goal weightages to exactly 100%. Each goal needs min 10%. Give 3-5 short bullet tips. Be concise, friendly, no JSON.",
        },
        {
          role: "user",
          content: `Current goals:\n${list}\nTotal weight: ${totalWeightage}% (must be 100% to submit).`,
        },
      ],
      { maxTokens: 280, temperature: 0.2, timeoutMs: 18000 },
    )

    return NextResponse.json({ advice: text.trim() })
  } catch (err) {
    console.error("[ai/weightage-coach]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI request failed" },
      { status: 500 },
    )
  }
}
