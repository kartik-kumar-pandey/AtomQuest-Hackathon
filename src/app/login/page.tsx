"use client"

import { useState } from "react"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { AuthShell } from "@/components/auth/auth-shell"

const inputClass =
  "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-slate-900 placeholder:text-slate-400"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    const result = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    })
    setLoading(false)
    if (result?.error) {
      setError("Invalid email or password. Please try again.")
    } else {
      router.push("/dashboard")
      router.refresh()
    }
  }

  const quickLogin = async (userEmail: string) => {
    setError("")
    setLoading(true)
    const result = await signIn("credentials", {
      email: userEmail,
      password: "password",
      redirect: false,
    })
    setLoading(false)
    if (result?.error) {
      setError("Login failed.")
    } else {
      router.push("/dashboard")
      router.refresh()
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue to your goal portal"
      footer={
        <p className="text-center text-sm mt-8" style={{ color: "#64748b" }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold hover:underline" style={{ color: "#6366f1" }}>
            Sign up
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5 text-slate-700">Email address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@atomberg.com"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5 text-slate-700">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className={inputClass}
          />
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl text-sm bg-red-50 border border-red-100 text-red-600">
            {error}
          </div>
        )}

        <button
          id="login-submit"
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-100">
        <p className="text-xs text-center mb-3 text-slate-400">Quick access (demo accounts)</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Admin", email: "admin@atomberg.com" },
            { label: "Manager", email: "manager1@atomberg.com" },
            { label: "Employee", email: "emp1@atomberg.com" },
          ].map(({ label, email: demoEmail }) => (
            <button
              key={label}
              id={`quick-login-${label.toLowerCase()}`}
              type="button"
              onClick={() => quickLogin(demoEmail)}
              disabled={loading}
              className="py-2.5 rounded-xl text-xs font-medium transition-all disabled:opacity-50 border border-slate-200 bg-slate-50 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </AuthShell>
  )
}

