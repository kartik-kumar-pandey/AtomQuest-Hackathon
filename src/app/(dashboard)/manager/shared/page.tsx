"use client"

import { useState, useEffect } from "react"
import { Loader2, Send, CheckCircle, X, Users, Target } from "lucide-react"

type User = { id: string; name: string; email: string; role: string }
type Goal = { id: string; title: string; target: number; uom: string; weightage: number; status: string }

const THRUST_AREAS = ["Engineering", "Sales", "Operations", "Finance", "HR", "Marketing", "Product", "Customer Success", "General"]
const UOM_OPTIONS = [
  { value: "MIN", label: "Min (Higher is better)" },
  { value: "MAX", label: "Max (Lower is better)" },
  { value: "TIMELINE", label: "Timeline (Date-based)" },
  { value: "ZERO", label: "Zero (Zero = success)" },
]

export default function SharedGoalsPage() {
  const [employees, setEmployees] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState({ text: "", ok: true })

  const [form, setForm] = useState({
    title: "",
    description: "",
    thrustArea: "General",
    uom: "MIN",
    target: "",
  })

  useEffect(() => {
    const fetchTeam = async () => {
      const res = await fetch("/api/users")
      const data = await res.json()
      if (Array.isArray(data)) {
        // Filter out employees reporting to this manager (the backend returns active manager's team or all based on role)
        // Since we are L1 manager, we fetch from `/api/users` which lists organization users, but we can also filter for our team.
        // Actually, let's fetch session info or team list directly.
        // To be safe, we list only EMPLOYEE users
        setEmployees(data.filter((u: User) => u.role === "EMPLOYEE"))
      }
      setLoading(false)
    }
    fetchTeam()
  }, [])

  const handleSelectEmployee = (id: string) => {
    setSelectedEmployees(prev =>
      prev.includes(id) ? prev.filter(empId => empId !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([])
    } else {
      setSelectedEmployees(employees.map(e => e.id))
    }
  }

  const handlePush = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedEmployees.length === 0) {
      setMsg({ text: "Please select at least one employee", ok: false })
      return
    }

    setSubmitting(true)
    setMsg({ text: "", ok: true })

    try {
      // Direct request to push the new master goal and select recipients atomically
      const pushRes = await fetch("/api/shared", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          target: Number(form.target),
          employeeIds: selectedEmployees,
        }),
      })

      const pushData = await pushRes.json()
      if (pushRes.ok) {
        setMsg({ text: `Successfully pushed shared goal to ${selectedEmployees.length} employees!`, ok: true })
        setForm({
          title: "",
          description: "",
          thrustArea: "General",
          uom: "MIN",
          target: "",
        })
        setSelectedEmployees([])
      } else {
        setMsg({ text: pushData.error || "Failed to push goal", ok: false })
      }
    } catch {
      setMsg({ text: "Network error occurred", ok: false })
    }

    setSubmitting(false)
    setTimeout(() => setMsg({ text: "", ok: true }), 4000)
  }

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Shared Goals (Departmental KPIs)</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          Push key departmental goals to multiple employees at once. Recipient employees cannot edit the title or targets.
        </p>
      </div>

      {msg.text && (
        <div className="flex items-center gap-2 p-4 rounded-xl mb-6 text-sm font-medium animate-fadeIn" style={{
          background: msg.ok ? "oklch(0.65 0.16 155 / 15%)" : "oklch(0.577 0.245 27 / 15%)",
          border: `1px solid ${msg.ok ? "oklch(0.65 0.16 155 / 30%)" : "oklch(0.577 0.245 27 / 30%)"}`,
          color: msg.ok ? "oklch(0.65 0.16 155)" : "oklch(0.7 0.2 27)",
        }}>
          {msg.ok ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Create Master Goal Form */}
        <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-6">
            <Target className="w-5 h-5" style={{ color: "oklch(0.65 0.18 265)" }} />
            <h2 className="font-semibold text-lg" style={{ color: "var(--foreground)" }}>Define Shared Goal Details</h2>
          </div>

          <form onSubmit={handlePush} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>Goal Title *</label>
              <input
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all focus:border-indigo-500"
                style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Increase customer satisfaction score to 90%"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>Thrust Area</label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  value={form.thrustArea}
                  onChange={e => setForm(f => ({ ...f, thrustArea: e.target.value }))}
                >
                  {THRUST_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>Unit of Measurement *</label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  value={form.uom}
                  onChange={e => setForm(f => ({ ...f, uom: e.target.value }))}
                  required
                >
                  {UOM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>Target *</label>
              <input
                type="number"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                value={form.target}
                onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                placeholder="e.g. 90"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>Description</label>
              <textarea
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
                style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Details of standard verification metrics or dependency updates..."
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={submitting || selectedEmployees.length === 0}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: "oklch(0.55 0.2 265)" }}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Push Shared Goal ({selectedEmployees.length})
              </button>
            </div>
          </form>
        </div>

        {/* Right: Select Employees */}
        <div className="rounded-2xl p-6 flex flex-col" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" style={{ color: "oklch(0.65 0.18 265)" }} />
              <h2 className="font-semibold text-lg" style={{ color: "var(--foreground)" }}>Select Recipients</h2>
            </div>
            {employees.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs font-semibold hover:underline"
                style={{ color: "oklch(0.65 0.18 265)" }}
              >
                {selectedEmployees.length === employees.length ? "Deselect All" : "Select All"}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto max-h-[360px] space-y-2 pr-1">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: "oklch(0.55 0.2 265)" }} />
              </div>
            ) : employees.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: "var(--muted-foreground)" }}>No team members found.</p>
            ) : (
              employees.map(emp => {
                const selected = selectedEmployees.includes(emp.id)
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => handleSelectEmployee(emp.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left"
                    style={{
                      background: selected ? "oklch(0.55 0.2 265 / 8%)" : "var(--muted)",
                      border: `1px solid ${selected ? "oklch(0.55 0.2 265 / 40%)" : "var(--border)"}`,
                    }}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white"
                      style={{ background: "linear-gradient(135deg, oklch(0.55 0.2 265), oklch(0.6 0.18 285))" }}>
                      {emp.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: "var(--foreground)" }}>{emp.name}</p>
                      <p className="text-[10px] truncate" style={{ color: "var(--muted-foreground)" }}>{emp.email}</p>
                    </div>
                    <div className="w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0"
                      style={{
                        borderColor: selected ? "oklch(0.55 0.2 265)" : "var(--border)",
                        background: selected ? "oklch(0.55 0.2 265)" : "transparent",
                      }}>
                      {selected && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
