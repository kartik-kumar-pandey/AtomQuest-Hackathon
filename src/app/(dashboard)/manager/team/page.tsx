import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { Users, ChevronRight } from "lucide-react"

const statusColors: Record<string, string> = {
  DRAFT: "bg-slate-500/15 text-slate-400",
  SUBMITTED: "bg-yellow-500/15 text-yellow-400",
  APPROVED: "bg-emerald-500/15 text-emerald-400",
  REJECTED: "bg-red-500/15 text-red-400",
  LOCKED: "bg-indigo-500/15 text-indigo-400",
}

export default async function TeamPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "MANAGER") redirect("/login")

  const team = await db.user.findMany({
    where: { managerId: session.user.id },
    include: { goals: { include: { checkins: true } } },
  })

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>My Team</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>{team.length} team members</p>
        </div>
      </div>

      {team.length === 0 ? (
        <div className="text-center py-16" style={{ color: "var(--muted-foreground)" }}>
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No team members assigned to you yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {team.map(emp => {
            const goals = emp.goals
            const submitted = goals.filter(g => g.status === "SUBMITTED")
            const approved = goals.filter(g => g.status === "APPROVED" || g.status === "LOCKED")
            const totalW = goals.reduce((s, g) => s + g.weightage, 0)
            return (
              <div key={emp.id} className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="px-6 py-4 flex items-center gap-4" style={{ borderBottom: goals.length > 0 ? "1px solid var(--border)" : undefined }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, oklch(0.55 0.2 265), oklch(0.6 0.18 285))" }}>
                    {emp.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold" style={{ color: "var(--foreground)" }}>{emp.name}</p>
                    <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{emp.email}</p>
                  </div>
                  <div className="flex items-center gap-6 text-center text-xs flex-shrink-0">
                    <div>
                      <p className="font-bold text-base" style={{ color: "var(--foreground)" }}>{goals.length}/8</p>
                      <p style={{ color: "var(--muted-foreground)" }}>Goals</p>
                    </div>
                    <div>
                      <p className="font-bold text-base" style={{ color: submitted.length ? "oklch(0.7 0.18 55)" : "oklch(0.65 0.16 155)" }}>{submitted.length}</p>
                      <p style={{ color: "var(--muted-foreground)" }}>Pending</p>
                    </div>
                    <div>
                      <p className="font-bold text-base" style={{ color: "oklch(0.65 0.16 155)" }}>{approved.length}</p>
                      <p style={{ color: "var(--muted-foreground)" }}>Approved</p>
                    </div>
                    <div>
                      <p className="font-bold text-base" style={{ color: Math.round(totalW) === 100 ? "oklch(0.65 0.16 155)" : "oklch(0.7 0.18 55)" }}>{totalW}%</p>
                      <p style={{ color: "var(--muted-foreground)" }}>Weight</p>
                    </div>
                  </div>
                </div>
                {goals.length > 0 && (
                  <div className="px-6 py-3">
                    <div className="flex flex-wrap gap-2">
                      {goals.map(goal => (
                        <div key={goal.id} className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
                          <span className="font-medium truncate max-w-[200px]" style={{ color: "var(--foreground)" }}>{goal.title}</span>
                          <span className={`px-1.5 py-0.5 rounded-full font-semibold ${statusColors[goal.status]}`}>{goal.status}</span>
                          <span className="font-semibold" style={{ color: "oklch(0.55 0.2 265)" }}>{goal.weightage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
