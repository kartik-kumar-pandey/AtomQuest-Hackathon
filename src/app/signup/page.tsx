"use client"

import { useState } from "react"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { AuthShell } from "@/components/auth/auth-shell"

const inputClass =
  "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-slate-900 placeholder:text-slate-400"

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || "Sign up failed.")
      setLoading(false)
      return
    }

    const signInResult = await signIn("credentials", {
      email: form.email.trim().toLowerCase(),
      password: form.password,
      redirect: false,
    })

    setLoading(false)

    if (signInResult?.error) {
      setError("Account created. Please sign in with your credentials.")
      router.push("/login")
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join as an employee and start tracking your goals"
      footer={
        <p className="text-center text-sm mt-8" style={{ color: "#64748b" }}>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold hover:underline" style={{ color: "#6366f1" }}>
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5 text-slate-700">Full name</label>
          <input
            type="text"
            className={inputClass}
            placeholder="Your name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5 text-slate-700">Work email</label>
          <input
            type="email"
            className={inputClass}
            placeholder="you@company.com"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5 text-slate-700">Password</label>
          <input
            type="password"
            className={inputClass}
            placeholder="Min. 6 characters"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            required
            minLength={6}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5 text-slate-700">Confirm password</label>
          <input
            type="password"
            className={inputClass}
            placeholder="Repeat password"
            value={form.confirmPassword}
            onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
            required
          />
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl text-sm bg-red-50 border border-red-100 text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {loading ? "Creating account…" : "Create account"}
        </button>

        <p className="text-xs text-center text-slate-400">
          New accounts are registered as <strong className="text-slate-500">Employee</strong>. Managers and admins are provisioned by HR.
        </p>
      </form>
    </AuthShell>
  )
}

