"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Pencil, Send, CheckCircle, X, Loader2, Info } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

type Goal = {
  id: string
  title: string
  description?: string
  thrustArea?: string
  uom: string
  target: number
  weightage: number
  status: string
}

const UOM_OPTIONS = [
  { value: "MIN", label: "Min (Higher is better)" },
  { value: "MAX", label: "Max (Lower is better)" },
  { value: "TIMELINE", label: "Timeline (Date-based)" },
  { value: "ZERO", label: "Zero (Zero = success)" },
]

const THRUST_AREAS = ["Engineering", "Sales", "Operations", "Finance", "HR", "Marketing", "Product", "Customer Success", "General"]

const statusColors: Record<string, string> = {
  DRAFT: "bg-slate-500/15 text-slate-400",
  SUBMITTED: "bg-yellow-500/15 text-yellow-400",
  APPROVED: "bg-emerald-500/15 text-emerald-400",
  REJECTED: "bg-red-500/15 text-red-400",
  LOCKED: "bg-indigo-500/15 text-indigo-400",
}

export default function GoalsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editGoal, setEditGoal] = useState<Goal | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [form, setForm] = useState({ title: "", description: "", thrustArea: "", uom: "MIN", target: "", weightage: "" })
  const isFullyLocked = editGoal?.status === "LOCKED"
  const isFieldsLocked = !!(editGoal && (editGoal.status === "APPROVED" || editGoal.status === "SUBMITTED"))

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "EMPLOYEE") {
      router.replace(session.user.role === "MANAGER" ? "/manager/dashboard" : "/admin/dashboard")
    }
  }, [session, status, router])

  const fetchGoals = async () => {
    const res = await fetch("/api/goals")
    const data = await res.json()
    setGoals(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { fetchGoals() }, [])

  const totalWeightage = goals.reduce((s, g) => s + g.weightage, 0)
  const editableGoals = goals.filter(g => g.status === "DRAFT" || g.status === "REJECTED")
  const submittableGoals = goals.filter(g => g.status === "DRAFT" || g.status === "REJECTED")
  const canSubmit = submittableGoals.length > 0 && Math.round(totalWeightage) === 100

  const resetForm = () => {
    setForm({ title: "", description: "", thrustArea: "", uom: "MIN", target: "", weightage: "" })
    setEditGoal(null)
    setShowForm(false)
    setError("")
  }

  const openEdit = (goal: Goal) => {
    setEditGoal(goal)
    setForm({ title: goal.title, description: goal.description ?? "", thrustArea: goal.thrustArea ?? "", uom: goal.uom, target: String(goal.target), weightage: String(goal.weightage) })
    setShowForm(true)
  }

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      let res
      if (editGoal) {
        res = await fetch(`/api/goals/${editGoal.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "update", ...form, target: Number(form.target), weightage: Number(form.weightage) }),
        })
      } else {
        res = await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, target: Number(form.target), weightage: Number(form.weightage) }),
        })
      }
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Failed"); setSubmitting(false); return }
      setSuccess(editGoal ? "Goal updated!" : "Goal created!")
      setTimeout(() => setSuccess(""), 3000)
      resetForm()
      fetchGoals()
    } catch {
      setError("Network error")
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this goal?")) return
    await fetch(`/api/goals/${id}`, { method: "DELETE" })
    fetchGoals()
  }

  const handleSubmitAll = async () => {
    setError("")
    setSubmitting(true)
    const goalIds = submittableGoals.map(g => g.id)
    let lastError = ""
    for (const id of goalIds) {
      const res = await fetch(`/api/goals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit" }),
      })
      if (!res.ok) {
        const d = await res.json()
        lastError = d.error
        break
      }
    }
    setSubmitting(false)
    if (lastError) { setError(lastError) } else {
      setSuccess("All goals submitted for manager review!")
      setTimeout(() => setSuccess(""), 4000)
      fetchGoals()
    }
  }

  const autoBalance = async () => {
    if (goals.length === 0) return
    const currentSum = goals.reduce((s, g) => s + g.weightage, 0)
    if (currentSum === 0) return

    setError("")
    setSubmitting(true)
    try {
      // Proportional scaling for all goals
      let newWeights = goals.map(g => ({
        id: g.id,
        weightage: Math.round((g.weightage / currentSum) * 100)
      }))

      // Clamp to minimum 10%
      newWeights = newWeights.map(nw => ({
        ...nw,
        weightage: Math.max(10, nw.weightage)
      }))

      // Redistribute residual difference to ensure exactly 100%
      let newSum = newWeights.reduce((s, nw) => s + nw.weightage, 0)
      let diff = 100 - newSum
      if (diff !== 0) {
        // Add/subtract difference from the goal with largest weight
        let maxIdx = 0
        let maxWeight = 0
        for (let i = 0; i < newWeights.length; i++) {
          if (newWeights[i].weightage > maxWeight) {
            maxWeight = newWeights[i].weightage
            maxIdx = i
          }
        }
        newWeights[maxIdx].weightage += diff
      }

      // Proactively update each goal
      for (const nw of newWeights) {
        const originalGoal = goals.find(g => g.id === nw.id)!
        
        const res = await fetch(`/api/goals/${nw.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            title: originalGoal.title,
            description: originalGoal.description || "",
            thrustArea: originalGoal.thrustArea || null,
            uom: originalGoal.uom,
            target: originalGoal.target,
            weightage: nw.weightage
          }),
        })

        if (!res.ok) {
          const errData = await res.json()
          throw new Error(errData.error || "Failed to update one of the goals.")
        }
      }

      setSuccess("Goal weights successfully auto-balanced to exactly 100%!")
      setTimeout(() => setSuccess(""), 4000)
      fetchGoals()
    } catch (err: any) {
      setError(err.message || "Failed to auto-balance goals.")
    }
    setSubmitting(false)
  }

  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>My Goals</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            {goals.length}/8 goals · {totalWeightage}% weightage used
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canSubmit && (
            <button
              id="submit-all-goals"
              onClick={handleSubmitAll}
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: "oklch(0.65 0.16 155)" }}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit for Review
            </button>
          )}
          {goals.length < 8 && (
            <button
              id="add-goal-btn"
              onClick={() => { resetForm(); setShowForm(true) }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, oklch(0.55 0.2 265), oklch(0.6 0.18 285))" }}
            >
              <Plus className="w-4 h-4" />
              Add Goal
            </button>
          )}
        </div>
      </div>

      {/* Weightage Bar */}
      <div className="rounded-2xl p-5 mb-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Total Weightage</p>
            {totalWeightage !== 100 && goals.length > 0 && (
              <button
                onClick={autoBalance}
                disabled={submitting}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold text-white transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, oklch(0.55 0.2 265), oklch(0.6 0.15 180))" }}
              >
                Auto-Balance
              </button>
            )}
          </div>
          <span className="text-sm font-bold" style={{ color: Math.round(totalWeightage) === 100 ? "oklch(0.65 0.16 155)" : "oklch(0.7 0.18 55)" }}>
            {totalWeightage}% / 100%
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
          <div className="h-full rounded-full transition-all" style={{
            width: `${Math.min(totalWeightage, 100)}%`,
            background: Math.round(totalWeightage) === 100 ? "oklch(0.65 0.16 155)" : totalWeightage > 100 ? "oklch(0.577 0.245 27.325)" : "oklch(0.55 0.2 265)"
          }} />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Info className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Min 10% per goal · Max 8 goals · Total must equal 100% to submit
          </p>
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div className="flex items-center gap-3 p-4 rounded-xl mb-4" style={{ background: "oklch(0.65 0.16 155 / 15%)", border: "1px solid oklch(0.65 0.16 155 / 30%)", color: "oklch(0.65 0.16 155)" }}>
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">{success}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl mb-4" style={{ background: "oklch(0.577 0.245 27 / 15%)", border: "1px solid oklch(0.577 0.245 27 / 30%)", color: "oklch(0.7 0.2 27)" }}>
          <X className="w-4 h-4" />
          <span className="text-sm font-medium">{error}</span>
          <button onClick={() => setError("")} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Add / Edit Form */}
      {showForm && (
        <div className="rounded-2xl p-6 mb-6" style={{ background: "var(--card)", border: "2px solid oklch(0.55 0.2 265 / 40%)" }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-lg" style={{ color: "var(--foreground)" }}>
              {editGoal ? "Edit Goal" : "New Goal"}
            </h2>
            <button onClick={resetForm}><X className="w-5 h-5" style={{ color: "var(--muted-foreground)" }} /></button>
          </div>
          
          {isFullyLocked && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-xs font-medium" style={{ background: "oklch(0.577 0.245 27 / 10%)", border: "1px solid oklch(0.577 0.245 27 / 20%)", color: "oklch(0.7 0.2 27)" }}>
              <Info className="w-4 h-4 flex-shrink-0" />
              <span>This goal is locked after manager approval. Contact Admin to unlock for edits.</span>
            </div>
          )}
          {isFieldsLocked && !isFullyLocked && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-xs font-medium" style={{ background: "oklch(0.7 0.18 55 / 10%)", border: "1px solid oklch(0.7 0.18 55 / 20%)", color: "oklch(0.7 0.18 55)" }}>
              <Info className="w-4 h-4 flex-shrink-0" />
              <span>This goal is approved/submitted. Title, Target, and UoM are locked; you can adjust the weightage to balance your sheet.</span>
            </div>
          )}

          <form onSubmit={handleSubmitForm} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>Goal Title *</label>
                <input
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all disabled:opacity-50"
                  style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Improve API response time by 20%"
                  required
                  disabled={isFieldsLocked}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>Thrust Area</label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none disabled:opacity-50"
                  style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  value={form.thrustArea}
                  onChange={e => setForm(f => ({ ...f, thrustArea: e.target.value }))}
                  disabled={isFieldsLocked}
                >
                  <option value="">Select area</option>
                  {THRUST_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>Unit of Measurement *</label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none disabled:opacity-50"
                  style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  value={form.uom}
                  onChange={e => setForm(f => ({ ...f, uom: e.target.value }))}
                  required
                  disabled={isFieldsLocked}
                >
                  {UOM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>Target *</label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none disabled:opacity-50"
                  style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  value={form.target}
                  onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                  placeholder="e.g. 100"
                  required
                  disabled={isFieldsLocked}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>Weightage (%) *</label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  value={form.weightage}
                  onChange={e => setForm(f => ({ ...f, weightage: e.target.value }))}
                  placeholder="Min 10"
                  required
                  disabled={isFullyLocked}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>Description</label>
                <textarea
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional description..."
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={resetForm} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>Cancel</button>
              <button type="submit" disabled={submitting} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: "oklch(0.55 0.2 265)" }}>
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {editGoal ? "Update Goal" : "Add Goal"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goals Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "oklch(0.55 0.2 265)" }} /></div>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center py-16" style={{ color: "var(--muted-foreground)" }}>
          <p className="font-medium">No goals yet. Click Add Goal to begin.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Goal", "Area", "UoM", "Target", "Weight", "Status", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
              {goals.map(goal => (
                <tr key={goal.id} className="hover:bg-slate-50/5 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium truncate max-w-xs" style={{ color: "var(--foreground)" }}>{goal.title}</p>
                    {goal.description && <p className="text-xs truncate max-w-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{goal.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{goal.thrustArea || "—"}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{goal.uom}</td>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--foreground)" }}>{goal.target}</td>
                  <td className="px-4 py-3 font-bold" style={{ color: "oklch(0.55 0.2 265)" }}>{goal.weightage}%</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusColors[goal.status]}`}>{goal.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {goal.status !== "LOCKED" && (
                        <button id={`edit-goal-${goal.id}`} onClick={() => openEdit(goal)} className="p-1.5 rounded-lg hover:bg-slate-500/10 transition-colors">
                          <Pencil className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
                        </button>
                      )}
                      {(goal.status === "DRAFT" || goal.status === "REJECTED") && (
                        <button id={`delete-goal-${goal.id}`} onClick={() => handleDelete(goal.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" style={{ color: "oklch(0.577 0.245 27)" }} />
                        </button>
                      )}
                    </div>
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
