"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Pencil, Send, CheckCircle, X, Loader2, Info, Sparkles, TrendingUp } from "lucide-react"
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
  progress: number
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
  const [aiLoading, setAiLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editGoal, setEditGoal] = useState<Goal | null>(null)
  const [progressGoal, setProgressGoal] = useState<Goal | null>(null)
  const [progressValue, setProgressValue] = useState("")
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

  const handleAIAssist = async () => {
    if (!form.title) {
      setError("Please provide at least a basic title for the AI to enhance.")
      return
    }
    setError("")
    setAiLoading(true)
    try {
      const res = await fetch("/api/goals/smart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          uom: form.uom,
          target: Number(form.target || 0)
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "AI Enhancement failed.")
      
      setForm(f => ({
        ...f,
        title: data.title || f.title,
        description: data.description || f.description,
        uom: data.uom || f.uom,
        target: data.target != null ? String(data.target) : f.target
      }))
      setSuccess("AI successfully made your goal SMART!")
      setTimeout(() => setSuccess(""), 4000)
    } catch (err: any) {
      setError(err.message)
    }
    setAiLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this goal?")) return
    await fetch(`/api/goals/${id}`, { method: "DELETE" })
    fetchGoals()
  }

  const handleUpdateProgress = async () => {
    if (!progressGoal) return
    const val = Number(progressValue)
    if (isNaN(val) || val < 0 || val > 100) {
      setError("Progress must be between 0 and 100.")
      return
    }
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch(`/api/goals/${progressGoal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-progress", progress: val }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update progress.")
      setSuccess(`Progress updated to ${val}%!`)
      setTimeout(() => setSuccess(""), 3000)
      setProgressGoal(null)
      setProgressValue("")
      fetchGoals()
    } catch (err: any) {
      setError(err.message)
    }
    setSubmitting(false)
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
      const lockedGoals = goals.filter(g => g.status === "LOCKED")
      const unlockedGoals = goals.filter(g => g.status !== "LOCKED")
      
      if (unlockedGoals.length === 0) {
        throw new Error("All goals are locked. Cannot auto-balance.")
      }

      const lockedSum = lockedGoals.reduce((s, g) => s + g.weightage, 0)
      const remainingTarget = 100 - lockedSum

      if (remainingTarget < 0) {
        throw new Error("Locked goals already exceed 100% weightage.")
      }

      const unlockedCurrentSum = unlockedGoals.reduce((s, g) => s + g.weightage, 0)
      
      let newWeights = unlockedGoals.map(g => ({
        id: g.id,
        // If unlockedSum is 0, distribute equally, else proportional
        weightage: unlockedCurrentSum === 0 
          ? Math.round(remainingTarget / unlockedGoals.length)
          : Math.round((g.weightage / unlockedCurrentSum) * remainingTarget)
      }))

      // Clamp to minimum 10% 
      newWeights = newWeights.map(nw => ({
        ...nw,
        weightage: Math.max(10, nw.weightage)
      }))

      // Redistribute residual difference to ensure sum of unlocked equals remainingTarget
      let newSum = newWeights.reduce((s, nw) => s + nw.weightage, 0)
      let diff = remainingTarget - newSum
      if (diff !== 0) {
        // Add/subtract difference from the goal with largest weight
        let maxIdx = 0
        let maxWeight = -1
        for (let i = 0; i < newWeights.length; i++) {
          if (newWeights[i].weightage > maxWeight) {
            maxWeight = newWeights[i].weightage
            maxIdx = i
          }
        }
        newWeights[maxIdx].weightage += diff
      }

      // Proactively update each non-locked goal
      for (const nw of newWeights) {
        const originalGoal = unlockedGoals.find(g => g.id === nw.id)!
        if (originalGoal.weightage === nw.weightage) continue // skip if no change needed
        
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
            <div className="flex gap-3 justify-end items-center mt-2">
              <button 
                type="button" 
                onClick={handleAIAssist} 
                disabled={aiLoading || submitting || isFieldsLocked} 
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 mr-auto" 
                style={{ background: "linear-gradient(135deg, oklch(0.85 0.1 80), oklch(0.8 0.15 65))", color: "oklch(0.3 0.1 65)" }}
              >
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {aiLoading ? "Thinking..." : "✨ Make it SMART"}
              </button>

              <button type="button" onClick={resetForm} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>Cancel</button>
              <button type="submit" disabled={submitting || aiLoading} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
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
        <div className="space-y-3">
          {goals.map(goal => {
            const canTrackProgress = goal.status === "APPROVED" || goal.status === "LOCKED"
            const progressPct = Math.min(100, goal.progress ?? 0)
            const progressColor = progressPct >= 100 ? "oklch(0.65 0.16 155)" : progressPct >= 60 ? "oklch(0.7 0.18 55)" : "oklch(0.55 0.2 265)"
            return (
              <div key={goal.id} className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{goal.title}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusColors[goal.status]}`}>{goal.status}</span>
                      {goal.thrustArea && <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-500/10 text-slate-400">{goal.thrustArea}</span>}
                    </div>
                    {goal.description && <p className="text-xs mb-2 line-clamp-1" style={{ color: "var(--muted-foreground)" }}>{goal.description}</p>}
                    <div className="flex items-center gap-4 text-xs" style={{ color: "var(--muted-foreground)" }}>
                      <span>Target: <strong style={{ color: "var(--foreground)" }}>{goal.target}</strong> ({goal.uom})</span>
                      <span>Weight: <strong style={{ color: "oklch(0.55 0.2 265)" }}>{goal.weightage}%</strong></span>
                    </div>
                    {/* Progress Bar */}
                    {canTrackProgress && (
                      <div className="mt-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[11px] font-medium" style={{ color: "var(--muted-foreground)" }}>Progress</span>
                          <span className="text-[11px] font-bold" style={{ color: progressColor }}>{progressPct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressPct}%`, background: progressColor }} />
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {canTrackProgress && (
                      <button
                        id={`progress-goal-${goal.id}`}
                        onClick={() => { setProgressGoal(goal); setProgressValue(String(goal.progress ?? 0)) }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-[1.03]"
                        style={{ background: "oklch(0.65 0.16 155 / 15%)", color: "oklch(0.55 0.16 155)" }}
                        title="Update Progress"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        Update
                      </button>
                    )}
                    {goal.status !== "LOCKED" && (
                      <button id={`edit-goal-${goal.id}`} onClick={() => openEdit(goal)} className="p-1.5 rounded-lg hover:bg-slate-500/10 transition-colors" title="Edit">
                        <Pencil className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
                      </button>
                    )}
                    {(goal.status === "DRAFT" || goal.status === "REJECTED") && (
                      <button id={`delete-goal-${goal.id}`} onClick={() => handleDelete(goal.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" style={{ color: "oklch(0.577 0.245 27)" }} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Progress Update Modal */}
      {progressGoal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-base" style={{ color: "var(--foreground)" }}>Update Progress</h2>
                <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--muted-foreground)" }}>{progressGoal.title}</p>
              </div>
              <button onClick={() => { setProgressGoal(null); setProgressValue("") }}><X className="w-5 h-5" style={{ color: "var(--muted-foreground)" }} /></button>
            </div>

            <div className="mb-5">
              <div className="flex justify-between text-sm mb-2">
                <span style={{ color: "var(--muted-foreground)" }}>Achievement %</span>
                <span className="font-bold" style={{ color: "oklch(0.55 0.2 265)" }}>{progressValue || 0}%</span>
              </div>
              <input
                type="range"
                min="0" max="100" step="1"
                value={progressValue || 0}
                onChange={e => setProgressValue(e.target.value)}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: "oklch(0.55 0.2 265)" }}
              />
              <div className="flex justify-between text-[10px] mt-1" style={{ color: "var(--muted-foreground)" }}>
                <span>0%</span><span>50%</span><span>100%</span>
              </div>
              <input
                type="number" min="0" max="100"
                value={progressValue}
                onChange={e => setProgressValue(e.target.value)}
                className="w-full mt-3 px-4 py-2.5 rounded-xl text-sm outline-none text-center font-bold"
                style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                placeholder="Or type exact %"
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setProgressGoal(null); setProgressValue("") }} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>Cancel</button>
              <button
                onClick={handleUpdateProgress}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, oklch(0.55 0.16 155), oklch(0.5 0.18 185))" }}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Save Progress
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

