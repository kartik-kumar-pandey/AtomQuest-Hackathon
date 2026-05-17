"use client"

import { useState, useEffect } from "react"
import { Plus, Loader2, Users, CheckCircle, X } from "lucide-react"

type User = { id: string; name: string; email: string; role: string; managerId?: string; createdAt: string }

const roleColors: Record<string, string> = {
  ADMIN: "bg-emerald-500/15 text-emerald-400",
  MANAGER: "bg-blue-500/15 text-blue-400",
  EMPLOYEE: "bg-indigo-500/15 text-indigo-400",
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", role: "EMPLOYEE", managerId: "" })
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState({ text: "", ok: true })

  const fetch_ = async () => {
    const res = await fetch("/api/users")
    const data = await res.json()
    setUsers(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { fetch_() }, [])

  const managers = users.filter(u => u.role === "MANAGER")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, managerId: form.managerId || undefined }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (res.ok) {
      setMsg({ text: "User created! Default password: password", ok: true })
      setShowForm(false)
      setForm({ name: "", email: "", role: "EMPLOYEE", managerId: "" })
      fetch_()
    } else {
      setMsg({ text: data.error || "Failed", ok: false })
    }
    setTimeout(() => setMsg({ text: "", ok: true }), 4000)
  }

  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Manage Users</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>{users.length} users in the system</p>
        </div>
        <button id="add-user-btn" onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, oklch(0.55 0.2 265), oklch(0.6 0.18 285))" }}>
          <Plus className="w-4 h-4" /> Add User
        </button>
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

      {showForm && (
        <div className="rounded-2xl p-6 mb-6" style={{ background: "var(--card)", border: "2px solid oklch(0.55 0.2 265 / 40%)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>New User</h2>
            <button onClick={() => setShowForm(false)}><X className="w-5 h-5" style={{ color: "var(--muted-foreground)" }} /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>Full Name *</label>
              <input className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Smith" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>Email *</label>
              <input type="email" className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@atomberg.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>Role</label>
              <select className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            {form.role === "EMPLOYEE" && (
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>Assign Manager</label>
                <select className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  value={form.managerId} onChange={e => setForm(f => ({ ...f, managerId: e.target.value }))}>
                  <option value="">No Manager</option>
                  {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            )}
            <div className="col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>Cancel</button>
              <button type="submit" disabled={submitting} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: "oklch(0.55 0.2 265)" }}>
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Create User
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["User", "Email", "Role", "Manager", "Joined"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
            {loading ? (
              <tr><td colSpan={5} className="py-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: "oklch(0.55 0.2 265)" }} /></td></tr>
            ) : users.map(user => {
              const manager = users.find(u => u.id === user.managerId)
              return (
                <tr key={user.id} className="hover:opacity-80 transition-opacity">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: "oklch(0.55 0.2 265 / 40%)" }}>{user.name.charAt(0)}</div>
                      <span className="font-medium" style={{ color: "var(--foreground)" }}>{user.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{user.email}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${roleColors[user.role]}`}>{user.role}</span>
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{manager?.name || "—"}</td>
                  <td className="px-5 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
