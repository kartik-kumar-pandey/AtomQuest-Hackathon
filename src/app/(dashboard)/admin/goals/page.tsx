"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Lock, Unlock, CheckCircle, X } from "lucide-react"

type Goal = {
  id: string
  title: string
  status: string
  weightage: number
  employee: { name: string; email: string }
}

export default function AdminGoalsPage() {
  const router = useRouter()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const [msg, setMsg] = useState("")
  const [error, setError] = useState("")

  const fetchGoals = async () => {
    const res = await fetch("/api/goals")
    const data = await res.json()
    setGoals(Array.isArray(data) ? data.filter((g: Goal) => g.status === "LOCKED" || g.status === "APPROVED") : [])
    setLoading(false)
  }

  useEffect(() => { fetchGoals() }, [])

  const toggleLock = async (goal: Goal) => {
    const action = goal.status === "LOCKED" ? "unlock" : "lock"
    setActing(goal.id + action)
    setError("")
    const res = await fetch(`/api/goals/${goal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })
    setActing(null)
    if (res.ok) {
      setMsg(goal.status === "LOCKED" ? "Goal unlocked — recorded in Audit Trail." : "Goal locked — recorded in Audit Trail.")
      setTimeout(() => setMsg(""), 4000)
      fetchGoals()
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error || "Action failed")
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Goal Management</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          Exception handling — unlock approved/locked goals when edits are required
        </p>
      </div>

      {msg && (
        <div className="flex items-center gap-2 p-4 rounded-xl mb-4 text-sm font-medium" style={{ background: "oklch(0.65 0.16 155 / 15%)", color: "oklch(0.65 0.16 155)" }}>
          <CheckCircle className="w-4 h-4" /> {msg}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl mb-4 text-sm font-medium" style={{ background: "oklch(0.577 0.245 27 / 15%)", color: "oklch(0.7 0.2 27)" }}>
          <X className="w-4 h-4" /> {error}
          <button onClick={() => setError("")} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "oklch(0.55 0.2 265)" }} /></div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Employee", "Goal", "Weight", "Status", "Action"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: "var(--muted-foreground)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {goals.map(goal => (
                <tr key={goal.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="px-5 py-3">
                    <p className="font-medium" style={{ color: "var(--foreground)" }}>{goal.employee.name}</p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{goal.employee.email}</p>
                  </td>
                  <td className="px-5 py-3 font-medium" style={{ color: "var(--foreground)" }}>{goal.title}</td>
                  <td className="px-5 py-3">{goal.weightage}%</td>
                  <td className="px-5 py-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: goal.status === "LOCKED" ? "oklch(0.55 0.2 265 / 15%)" : "oklch(0.65 0.16 155 / 15%)", color: goal.status === "LOCKED" ? "oklch(0.75 0.15 265)" : "oklch(0.65 0.16 155)" }}>
                      {goal.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => toggleLock(goal)}
                      disabled={acting !== null}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                      style={{ background: goal.status === "LOCKED" ? "oklch(0.65 0.16 155)" : "oklch(0.55 0.2 265)" }}
                    >
                      {acting === goal.id + (goal.status === "LOCKED" ? "unlock" : "lock")
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : goal.status === "LOCKED" ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      {goal.status === "LOCKED" ? "Unlock" : "Lock"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}


