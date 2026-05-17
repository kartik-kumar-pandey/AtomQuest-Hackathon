"use client"

import { useState, useEffect } from "react"
import { Loader2, MessageSquare, CheckCircle, X, BarChart2 } from "lucide-react"

type Checkin = {
  id: string
  quarter: string
  achievement: number
  status: string
  comment?: string
  managerComment?: string
  goal: {
    id: string
    title: string
    target: number
    uom: string
    weightage: number
    employee: { id: string; name: string; email: string }
  }
}

const STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: "bg-slate-500/15 text-slate-400",
  ON_TRACK: "bg-yellow-500/15 text-yellow-400",
  COMPLETED: "bg-emerald-500/15 text-emerald-400",
}

import { computeScore } from "@/lib/goal-utils"

export default function ManagerCheckinsPage() {
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [loading, setLoading] = useState(true)
  const [commenting, setCommenting] = useState<string | null>(null)
  const [commentText, setCommentText] = useState("")
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState({ text: "", ok: true })
  const [filterQ, setFilterQ] = useState("ALL")

  const fetchCheckins = async () => {
    const res = await fetch("/api/checkins")
    const data = await res.json()
    setCheckins(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { fetchCheckins() }, [])

  const openComment = (checkin: Checkin) => {
    setCommenting(checkin.id)
    setCommentText(checkin.managerComment || "")
  }

  const saveComment = async (checkinId: string) => {
    setSaving(true)
    const res = await fetch("/api/checkins/comment", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkinId, managerComment: commentText }),
    })
    setSaving(false)
    if (res.ok) {
      setMsg({ text: "Comment saved!", ok: true })
      setCommenting(null)
      fetchCheckins()
    } else {
      setMsg({ text: "Failed to save", ok: false })
    }
    setTimeout(() => setMsg({ text: "", ok: true }), 3000)
  }

  const quarters = ["ALL", "Q1", "Q2", "Q3", "Q4"]
  const filtered = filterQ === "ALL" ? checkins : checkins.filter(c => c.quarter === filterQ)

  // Group by employee
  const grouped: Record<string, Checkin[]> = {}
  filtered.forEach(c => {
    const name = c.goal.employee.name
    if (!grouped[name]) grouped[name] = []
    grouped[name].push(c)
  })

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Team Reviews</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            Review quarterly check-ins and add structured feedback
          </p>
        </div>
        {/* Quarter filter */}
        <div className="flex items-center gap-2">
          {quarters.map(q => (
            <button key={q}
              id={`filter-${q}`}
              onClick={() => setFilterQ(q)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: filterQ === q ? "oklch(0.55 0.2 265)" : "var(--muted)",
                color: filterQ === q ? "white" : "var(--muted-foreground)",
                border: `1px solid ${filterQ === q ? "oklch(0.55 0.2 265)" : "var(--border)"}`,
              }}>
              {q}
            </button>
          ))}
        </div>
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
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "oklch(0.55 0.2 265)" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: "var(--muted-foreground)" }}>
          <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No check-ins logged yet for {filterQ === "ALL" ? "any quarter" : filterQ}.</p>
          <p className="text-sm mt-1">Check-ins appear here once your team logs achievements.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([empName, empCheckins]) => (
            <div key={empName} className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              {/* Employee Header */}
              <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: "1px solid var(--border)", background: "oklch(0.55 0.2 265 / 5%)" }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, oklch(0.55 0.2 265), oklch(0.6 0.18 285))" }}>
                  {empName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold" style={{ color: "var(--foreground)" }}>{empName}</p>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{empCheckins.length} check-in{empCheckins.length !== 1 ? "s" : ""}</p>
                </div>
              </div>

              {/* Check-ins */}
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {empCheckins.map(checkin => {
                  const score = computeScore(checkin.goal.uom, checkin.goal.target, checkin.achievement)
                  const scoreColor = score >= 80 ? "oklch(0.65 0.16 155)" : score >= 50 ? "oklch(0.7 0.18 55)" : "oklch(0.577 0.245 27)"
                  return (
                    <div key={checkin.id} className="px-6 py-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "oklch(0.55 0.2 265 / 15%)", color: "oklch(0.75 0.15 265)" }}>
                              {checkin.quarter}
                            </span>
                            <p className="font-medium text-sm truncate" style={{ color: "var(--foreground)" }}>{checkin.goal.title}</p>
                          </div>
                          <div className="flex items-center gap-6 text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>
                            <span>Target: <strong style={{ color: "var(--foreground)" }}>{checkin.goal.target}</strong></span>
                            <span>Achieved: <strong style={{ color: "var(--foreground)" }}>{checkin.achievement}</strong></span>
                            <span>Weight: <strong style={{ color: "oklch(0.55 0.2 265)" }}>{checkin.goal.weightage}%</strong></span>
                            <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${STATUS_COLORS[checkin.status]}`}>
                              {checkin.status.replace("_", " ")}
                            </span>
                          </div>
                          {/* Score Bar */}
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(score, 100)}%`, background: scoreColor }} />
                            </div>
                            <span className="text-xs font-bold flex-shrink-0" style={{ color: scoreColor }}>{score.toFixed(0)}%</span>
                          </div>
                          {checkin.comment && (
                            <p className="text-xs mt-2 italic" style={{ color: "var(--muted-foreground)" }}>
                              Employee: "{checkin.comment}"
                            </p>
                          )}
                          {checkin.managerComment && (
                            <div className="mt-2 px-3 py-2 rounded-lg" style={{ background: "oklch(0.55 0.2 265 / 10%)", border: "1px solid oklch(0.55 0.2 265 / 20%)" }}>
                              <p className="text-xs font-medium mb-0.5" style={{ color: "oklch(0.75 0.15 265)" }}>Your Review:</p>
                              <p className="text-xs" style={{ color: "var(--foreground)" }}>{checkin.managerComment}</p>
                            </div>
                          )}
                        </div>
                        <button
                          id={`comment-${checkin.id}`}
                          onClick={() => openComment(checkin)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex-shrink-0"
                          style={{
                            background: checkin.managerComment ? "oklch(0.55 0.2 265 / 15%)" : "var(--muted)",
                            color: checkin.managerComment ? "oklch(0.75 0.15 265)" : "var(--muted-foreground)",
                            border: `1px solid ${checkin.managerComment ? "oklch(0.55 0.2 265 / 30%)" : "var(--border)"}`,
                          }}>
                          <MessageSquare className="w-3.5 h-3.5" />
                          {checkin.managerComment ? "Edit Review" : "Add Review"}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment Modal */}
      {commenting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "oklch(0 0 0 / 60%)" }}>
          <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold" style={{ color: "var(--foreground)" }}>Add Review Comment</h3>
              <button onClick={() => setCommenting(null)}><X className="w-5 h-5" style={{ color: "var(--muted-foreground)" }} /></button>
            </div>
            <textarea
              rows={4}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none mb-4"
              style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Write your structured feedback here... e.g. 'Good progress on Q1. Focus on increasing the achievement rate for Q2.'"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setCommenting(null)} className="px-4 py-2 rounded-xl text-sm" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>Cancel</button>
              <button onClick={() => saveComment(commenting)} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: "oklch(0.55 0.2 265)" }}>
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                Save Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
