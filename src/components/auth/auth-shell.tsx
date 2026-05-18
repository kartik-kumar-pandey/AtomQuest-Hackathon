import Link from "next/link"
import { Target, TrendingUp, Users, CheckCircle2 } from "lucide-react"
import { Logo } from "../ui/logo"

type AuthShellProps = {
  children: React.ReactNode
  title: string
  subtitle: string
  footer?: React.ReactNode
}

export function AuthShell({ children, title, subtitle, footer }: AuthShellProps) {
  return (
    <div className="min-h-screen flex" style={{ background: "var(--auth-bg)" }}>
      {/* Left — Tracked-style preview panel */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #f0f4ff 0%, #e8eeff 45%, #f5f3ff 100%)" }}>
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-40 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #a78bfa 0%, transparent 70%)" }} />
        <div className="absolute bottom-20 left-10 w-64 h-64 rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #818cf8 0%, transparent 70%)" }} />

        <div className="relative z-10">
          <Link href="/login">
            <Logo showText={true} size={42} />
          </Link>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <h1 className="text-4xl font-bold leading-tight tracking-tight" style={{ color: "#1e1b4b" }}>
            Track goals.<br />
            <span style={{ color: "#6366f1" }}>Drive results.</span>
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "#64748b" }}>
            Align individual ambitions with organizational priorities — inspired by modern goal-tracking dashboards.
          </p>

          {/* Mini dashboard preview cards */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <PreviewCard icon={Target} label="Active Goals" value="12" trend="+2 this cycle" color="#6366f1" />
            <PreviewCard icon={TrendingUp} label="Avg. Progress" value="78%" trend="On track" color="#10b981" />
          </div>
          <div className="rounded-2xl p-4 bg-white/80 backdrop-blur border border-white shadow-xl shadow-indigo-100/50">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94a3b8" }}>Team completion</p>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">Q1</span>
            </div>
            <div className="space-y-2">
              {[
                { name: "Engineering", pct: 85 },
                { name: "Sales", pct: 62 },
                { name: "Product", pct: 91 },
              ].map(row => (
                <div key={row.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: "#475569" }}>{row.name}</span>
                    <span className="font-semibold" style={{ color: "#6366f1" }}>{row.pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${row.pct}%`, background: "linear-gradient(90deg, #6366f1, #a78bfa)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 flex gap-6 text-xs" style={{ color: "#94a3b8" }}>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Quarterly check-ins</span>
          <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-indigo-500" /> Role-based access</span>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10" style={{ background: "#ffffff" }}>
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Logo showText={true} size={32} />
          </div>
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: "#1e1b4b" }}>{title}</h2>
            <p className="text-sm mt-1.5" style={{ color: "#64748b" }}>{subtitle}</p>
          </div>
          {children}
          {footer}
        </div>
      </div>
    </div>
  )
}

function PreviewCard({ icon: Icon, label, value, trend, color }: { icon: typeof Target; label: string; value: string; trend: string; color: string }) {
  return (
    <div className="rounded-2xl p-4 bg-white/90 border border-white shadow-lg shadow-indigo-100/40">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}18` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <p className="text-2xl font-bold" style={{ color: "#1e1b4b" }}>{value}</p>
      <p className="text-xs font-medium mt-0.5" style={{ color: "#64748b" }}>{label}</p>
      <p className="text-[10px] mt-1" style={{ color }}>{trend}</p>
    </div>
  )
}

