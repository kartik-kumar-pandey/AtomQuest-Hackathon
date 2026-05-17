"use client"

import { useState, useEffect } from "react"
import { Loader2, CheckCircle, X, BarChart2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { computeScore } from "@/lib/goal-utils"
import { getActivePhase, isCheckinOpen } from "@/lib/cycle"

type Goal = { id: string; title: string; target: number; uom: string; weightage: number; status: string; checkins: Checkin[] }
type Checkin = { id: string; goalId: string; quarter: string; achievement: number; status: string; comment?: string; managerComment?: string }

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"]
const STATUS_OPTIONS = ["NOT_STARTED", "ON_TRACK", "COMPLETED"]
const STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: "text-slate-400",
  ON_TRACK: "text-yellow-400",
  COMPLETED: "text-emerald-400",
}

export default function CheckinsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [selectedQ, setSelectedQ] = useState("Q1")
  const [form, setForm] = useState({ achievement: "", status: "ON_TRACK", comment: "" })
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState({ text: "", ok: true })

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "EMPLOYEE") {
      router.replace(session.user.role === "MANAGER" ? "/manager/dashboard" : "/admin/dashboard")
    }
  }, [session, status, router])

  const fetchGoals = async () => {
    const res = await fetch("/api/goals")
    const data = await res.json()
    const approved = Array.isArray(data) ? data.filter((g: Goal) => g.status === "APPROVED" || g.status === "LOCKED") : []
    setGoals(approved)
    setLoading(false)
  }

  useEffect(() => { fetchGoals() }, [])

  const existingCheckin = (goalId: string, q: string) =>
    goals.find(g => g.id === goalId)?.checkins.find(c => c.quarter === q)

  const openCheckin = (goal: Goal, q: string) => {
    const existing = goal.checkins.find(c => c.quarter === q)
    setSelectedGoal(goal)
    setSelectedQ(q)
    setForm({ achievement: existing ? String(existing.achievement) : "", status: existing?.status || "ON_TRACK", comment: existing?.comment || "" })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGoal) return
    setSubmitting(true)
    const res = await fetch("/api/checkins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goalId: selectedGoal.id, quarter: selectedQ, achievement: Number(form.achievement), status: form.status, comment: form.comment }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (res.ok) {
      setMsg({ text: "Check-in saved!", ok: true })
      setSelectedGoal(null)
      fetchGoals()
    } else {
      setMsg({ text: data.error || "Failed", ok: false })
    }
    setTimeout(() => setMsg({ text: "", ok: true }), 3000)
  }

  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Quarterly Check-ins</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>Log your actual achievement for each approved goal per quarter</p>
        {getActivePhase() && (
          <p className="text-xs mt-2 px-3 py-1.5 rounded-lg inline-block" style={{ background: "oklch(0.55 0.2 265 / 12%)", color: "oklch(0.75 0.15 265)" }}>
            Active window: {getActivePhase()!.period} ({getActivePhase()!.window})
          </p>
        )}
      </div>

      {msg.text && (
        <div className="flex items-center gap-2 p-4 rounded-xl mb-4 text-sm font-medium" style={{
          background: msg.ok ? "oklch(0.65 0.16 155 / 15%)" : "oklch(0.577 0.245 27 / 15%)",
          border: `1px solid ${msg.ok ? "oklch(0.65 0.16 155 / 30%)" : "oklch(0.577 0.245 27 / 30%)"}`,
          color: msg.ok ? "oklch(0.65 0.16 155)" : "oklch(0.7 0.2 27)",
        }}>
          {msg.ok ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "oklch(0.55 0.2 265)" }} /></div>
      ) : goals.length === 0 ? (
        <div className="text-center py-16" style={{ color: "var(--muted-foreground)" }}>
          <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No approved goals yet.</p>
          <p className="text-sm mt-1">Check-ins are available once your manager approves your goals.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map(goal => (
            <div key={goal.id} className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{goal.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Target: {goal.target} · UoM: {goal.uom} · Weight: {goal.weightage}%</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 divide-x" style={{ borderColor: "var(--border)" }}>
                {QUARTERS.map(q => {
                  const checkin = goal.checkins.find(c => c.quarter === q)
                  const score = checkin ? computeScore(goal.uom, goal.target, checkin.achievement) : null
                  const windowOpen = isCheckinOpen(q)
                  return (
                    <button
                      key={q}
                      id={`checkin-${goal.id}-${q}`}
                      onClick={() => openCheckin(goal, q)}
                      disabled={!windowOpen}
                      title={windowOpen ? undefined : `${q} check-in window is not open`}
                      className="p-4 text-left hover:opacity-80 transition-all"
                      style={{ background: checkin ? "oklch(0.55 0.2 265 / 5%)" : undefined }}
                    >
                      <p className="text-xs font-bold mb-2" style={{ color: "var(--muted-foreground)" }}>{q}</p>
                      {checkin ? (
                        <>
                          <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{checkin.achievement}</p>
                          <p className={`text-[10px] font-semibold mt-0.5 ${STATUS_COLORS[checkin.status]}`}>{checkin.status.replace("_", " ")}</p>
                          {score !== null && (
                            <div className="mt-2">
                              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                                <div className="h-full rounded-full" style={{ width: `${Math.min(score, 100)}%`, background: score >= 75 ? "oklch(0.65 0.16 155)" : score >= 50 ? "oklch(0.7 0.18 55)" : "oklch(0.577 0.245 27)" }} />
                              </div>
                              <p className="text-[10px] mt-1" style={{ color: "var(--muted-foreground)" }}>{score.toFixed(0)}%</p>
                            </div>
                          )}
                          {checkin.managerComment && (
                            <p className="text-[10px] mt-1 italic truncate" style={{ color: "oklch(0.65 0.18 265)" }}>"{checkin.managerComment}"</p>
                          )}
                        </>
                      ) : (
                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Click to log</p>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Checkin Modal */}
      {selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "oklch(0 0 0 / 60%)" }}>
          <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold" style={{ color: "var(--foreground)" }}>{selectedQ} Check-in</h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{selectedGoal.title}</p>
              </div>
              <button onClick={() => setSelectedGoal(null)}><X className="w-5 h-5" style={{ color: "var(--muted-foreground)" }} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>
                  {selectedGoal.uom === "TIMELINE" ? "Completion Date (YYYYMMDD)" : "Actual Achievement"}
                </label>
                <input type="number" step="any" className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  value={form.achievement} onChange={e => setForm(f => ({ ...f, achievement: e.target.value }))}
                  placeholder={selectedGoal.uom === "TIMELINE" ? `Deadline: ${selectedGoal.target}` : `Target: ${selectedGoal.target}`}
                  required />
                {selectedGoal.uom === "TIMELINE" && (
                  <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>100% if completed on or before deadline ({selectedGoal.target})</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>Status</label>
                <div className="flex gap-2">
                  {STATUS_OPTIONS.map(s => (
                    <button key={s} type="button" id={`status-${s}`}
                      onClick={() => setForm(f => ({ ...f, status: s }))}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        background: form.status === s ? "oklch(0.55 0.2 265 / 20%)" : "var(--muted)",
                        border: `1px solid ${form.status === s ? "oklch(0.55 0.2 265)" : "var(--border)"}`,
                        color: form.status === s ? "oklch(0.75 0.15 265)" : "var(--muted-foreground)",
                      }}>
                      {s.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>Comments</label>
                <textarea rows={2} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} placeholder="Add any remarks..." />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setSelectedGoal(null)} className="px-4 py-2 rounded-xl text-sm" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>Cancel</button>
                <button type="submit" disabled={submitting} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                  style={{ background: "oklch(0.55 0.2 265)" }}>
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Save Check-in
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
