"use client"

import { useState, useEffect, useMemo } from "react"
import { CheckCircle, XCircle, Pencil, Loader2, X, Save } from "lucide-react"

type Goal = {
  id: string
  title: string
  description?: string
  thrustArea?: string
  uom: string
  target: number
  weightage: number
  status: string
  employee: { id: string; name: string; email: string }
}

export default function ApprovalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [editForm, setEditForm] = useState({ target: "", weightage: "" })
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [msg, setMsg] = useState("")

  const fetch_ = async () => {
    const res = await fetch("/api/goals")
    const data = await res.json()
    setGoals(Array.isArray(data) ? data.filter((g: Goal) => g.status === "SUBMITTED") : [])
    setLoading(false)
  }

  useEffect(() => { fetch_() }, [])

  const grouped = useMemo(() => {
    const map = new Map<string, { employee: Goal["employee"]; goals: Goal[] }>()
    for (const g of goals) {
      const existing = map.get(g.employee.id)
      if (existing) existing.goals.push(g)
      else map.set(g.employee.id, { employee: g.employee, goals: [g] })
    }
    return [...map.values()]
  }, [goals])

  const act = async (id: string, action: string, extra?: object) => {
    setSubmitting(id + action)
    const res = await fetch(`/api/goals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    })
    setSubmitting(null)
    if (res.ok) {
      setMsg(
        action === "approve" ? "Goal approved and locked!"
          : action === "reject" ? "Goal returned for rework."
          : "Goal updated!"
      )
      setTimeout(() => setMsg(""), 3000)
      fetch_()
      setEditingGoal(null)
    }
  }

  const approveAllForEmployee = async (employeeId: string, firstGoalId: string) => {
    setSubmitting("approve-all-" + employeeId)
    const res = await fetch(`/api/goals/${firstGoalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve-all", employeeId }),
    })
    setSubmitting(null)
    if (res.ok) {
      const data = await res.json()
      setMsg(`Approved and locked ${data.count} goal(s)!`)
      setTimeout(() => setMsg(""), 3000)
      fetch_()
    }
  }

  const openEdit = (goal: Goal) => {
    setEditingGoal(goal)
    setEditForm({ target: String(goal.target), weightage: String(goal.weightage) })
  }

  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Pending Approvals</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          Review submitted goals — approve, return for rework, or edit inline.
        </p>
      </div>

      {msg && (
        <div className="flex items-center gap-2 p-4 rounded-xl mb-4 text-sm font-medium" style={{ background: "oklch(0.65 0.16 155 / 15%)", border: "1px solid oklch(0.65 0.16 155 / 30%)", color: "oklch(0.65 0.16 155)" }}>
          <CheckCircle className="w-4 h-4" /> {msg}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "oklch(0.55 0.2 265)" }} /></div>
      ) : goals.length === 0 ? (
        <div className="text-center py-16" style={{ color: "var(--muted-foreground)" }}>
          <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: "oklch(0.65 0.16 155)" }} />
          <p className="font-semibold">All caught up! No pending approvals.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ employee, goals: empGoals }) => (
            <div key={employee.id}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: "linear-gradient(135deg, oklch(0.55 0.2 265), oklch(0.6 0.18 285))" }}>
                    {employee.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: "var(--foreground)" }}>{employee.name}</p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{employee.email} · {empGoals.length} goal(s) pending</p>
                  </div>
                </div>
                <button
                  onClick={() => approveAllForEmployee(employee.id, empGoals[0].id)}
                  disabled={submitting !== null}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: "oklch(0.65 0.16 155)" }}
                >
                  {submitting === "approve-all-" + employee.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  Approve All & Lock
                </button>
              </div>

              <div className="space-y-4">
                {empGoals.map(goal => (
                  <div key={goal.id} className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-5">
                      <div className="col-span-2">
                        <p className="text-xs font-medium mb-0.5" style={{ color: "var(--muted-foreground)" }}>Goal Title</p>
                        <p className="font-semibold" style={{ color: "var(--foreground)" }}>{goal.title}</p>
                      </div>
                      {[
                        { label: "Thrust Area", val: goal.thrustArea || "—" },
                        { label: "UoM", val: goal.uom },
                        { label: "Target", val: goal.target },
                        { label: "Weightage", val: `${goal.weightage}%` },
                      ].map(({ label, val }) => (
                        <div key={label}>
                          <p className="text-xs font-medium mb-0.5" style={{ color: "var(--muted-foreground)" }}>{label}</p>
                          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{val}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <button onClick={() => act(goal.id, "approve")} disabled={submitting !== null}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                        style={{ background: "oklch(0.65 0.16 155)" }}>
                        <CheckCircle className="w-3.5 h-3.5" /> Approve & Lock
                      </button>
                      <button onClick={() => act(goal.id, "reject")} disabled={submitting !== null}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                        style={{ background: "oklch(0.577 0.245 27 / 15%)", color: "oklch(0.7 0.2 27)", border: "1px solid oklch(0.577 0.245 27 / 30%)" }}>
                        <XCircle className="w-3.5 h-3.5" /> Return for Rework
                      </button>
                      <button onClick={() => openEdit(goal)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                        style={{ background: "var(--muted)", color: "var(--foreground)" }}>
                        <Pencil className="w-3.5 h-3.5" /> Edit Target
                      </button>
                    </div>

                    {editingGoal?.id === goal.id && (
                      <div className="mt-4 pt-4 rounded-xl p-4" style={{ borderTop: "1px solid var(--border)", background: "oklch(0.55 0.2 265 / 5%)" }}>
                        <div className="flex gap-3 items-end">
                          <div className="flex-1">
                            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted-foreground)" }}>New Target</label>
                            <input type="number" className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                              style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                              value={editForm.target} onChange={e => setEditForm(f => ({ ...f, target: e.target.value }))} />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted-foreground)" }}>New Weightage (%)</label>
                            <input type="number" className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                              style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                              value={editForm.weightage} onChange={e => setEditForm(f => ({ ...f, weightage: e.target.value }))} />
                          </div>
                          <button onClick={() => act(goal.id, "edit", { target: editForm.target, weightage: editForm.weightage })}
                            className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "oklch(0.55 0.2 265)" }}>
                            <Save className="w-3.5 h-3.5 inline" /> Save
                          </button>
                          <button onClick={() => setEditingGoal(null)} className="p-2 rounded-xl" style={{ background: "var(--muted)" }}>
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

