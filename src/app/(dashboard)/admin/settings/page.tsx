"use client"

import { useState } from "react"
import { Download, CheckCircle, Settings, RefreshCw } from "lucide-react"

export default function AdminSettings() {
  const [exporting, setExporting] = useState(false)
  const [exportMsg, setExportMsg] = useState("")

  const handleExport = async () => {
    setExporting(true)
    setExportMsg("")
    try {
      const res = await fetch("/api/export")
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `atomquest-report-${new Date().toISOString().slice(0, 10)}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setExportMsg("Report downloaded successfully!")
      } else {
        setExportMsg("Export failed.")
      }
    } catch {
      setExportMsg("Network error.")
    }
    setExporting(false)
    setTimeout(() => setExportMsg(""), 4000)
  }

  return (
    <div className="p-8 max-w-3xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          Portal configuration and data management
        </p>
      </div>

      {/* Reporting Section */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Download className="w-5 h-5" style={{ color: "oklch(0.65 0.18 265)" }} />
          <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>Reports & Exports</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
            <div>
              <p className="font-medium text-sm" style={{ color: "var(--foreground)" }}>Achievement Report (CSV)</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                All goals with planned target vs actual achievement for all employees
              </p>
            </div>
            <button
              id="export-csv"
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
              style={{ background: "oklch(0.55 0.2 265)" }}>
              {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {exporting ? "Exporting…" : "Export CSV"}
            </button>
          </div>
        </div>
        {exportMsg && (
          <div className="flex items-center gap-2 mt-3 p-3 rounded-xl text-sm font-medium" style={{ background: "oklch(0.65 0.16 155 / 15%)", color: "oklch(0.65 0.16 155)" }}>
            <CheckCircle className="w-4 h-4" /> {exportMsg}
          </div>
        )}
      </div>

      {/* Goal Cycle Info */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5" style={{ color: "oklch(0.65 0.18 265)" }} />
          <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>Goal Cycle Schedule</h2>
        </div>
        <div className="space-y-2">
          {[
            { period: "Phase 1 — Goal Setting", window: "1st May", action: "Goal Creation, Submission & Approval" },
            { period: "Q1 Check-in", window: "July", action: "Progress Update — Planned vs. Actual" },
            { period: "Q2 Check-in", window: "October", action: "Progress Update — Planned vs. Actual" },
            { period: "Q3 Check-in", window: "January", action: "Progress Update — Planned vs. Actual" },
            { period: "Q4 / Annual", window: "March / April", action: "Final Achievement Capture" },
          ].map(({ period, window, action }) => (
            <div key={period} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
              <div className="w-28 flex-shrink-0">
                <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: "oklch(0.55 0.2 265 / 15%)", color: "oklch(0.75 0.15 265)" }}>{window}</span>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{period}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{action}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Validation Rules Info */}
      <div className="rounded-2xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <h2 className="font-semibold mb-4" style={{ color: "var(--foreground)" }}>Goal Validation Rules</h2>
        <div className="space-y-2">
          {[
            { rule: "Total Weightage", constraint: "Must equal exactly 100%", icon: "⚖️" },
            { rule: "Minimum Weightage", constraint: "At least 10% per individual goal", icon: "📉" },
            { rule: "Maximum Goals", constraint: "Up to 8 goals per employee per cycle", icon: "🎯" },
            { rule: "Goal Lock", constraint: "Approved goals are locked — edits require Admin unlock", icon: "🔒" },
          ].map(({ rule, constraint, icon }) => (
            <div key={rule} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "var(--muted)" }}>
              <span className="text-base">{icon}</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{rule}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{constraint}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
