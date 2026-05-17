import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Shield } from "lucide-react"
import { formatAuditEntry } from "@/lib/audit-format"

export const dynamic = "force-dynamic"

export default async function AuditPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") redirect("/login")

  const logs = await db.auditLog.findMany({
    orderBy: { timestamp: "desc" },
    take: 100,
  })

  const userIds = [...new Set(logs.map(l => l.changedBy))]
  const users = await db.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
  const userMap = Object.fromEntries(users.map(u => [u.id, u.name]))

  const goalIds = logs.filter(l => l.entityType === "Goal").map(l => l.entityId)
  const goals = await db.goal.findMany({
    where: { id: { in: goalIds } },
    select: { id: true, title: true, status: true, employee: { select: { name: true } } },
  })
  const goalMap = Object.fromEntries(goals.map(g => [g.id, g]))

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Audit Trail</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          All goal unlocks, approvals, check-ins, and edits are recorded here.
        </p>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="px-6 py-4 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
          <Shield className="w-4 h-4" style={{ color: "oklch(0.65 0.18 265)" }} />
          <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>{logs.length} Audit Events</h2>
        </div>

        {logs.length === 0 ? (
          <div className="py-16 text-center" style={{ color: "var(--muted-foreground)" }}>
            <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No audit events yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Timestamp", "Action", "Goal / Entity", "Changed By", "Details"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {logs.map(log => {
                  const goal = log.entityType === "Goal" ? goalMap[log.entityId] : null
                  const summary = formatAuditEntry(log.oldValue, log.newValue)
                  const isUnlock = log.newValue?.includes("ADMIN_UNLOCK")
                  return (
                    <tr key={log.id} className="hover:opacity-80 transition-opacity" style={isUnlock ? { background: "oklch(0.65 0.16 155 / 6%)" } : undefined}>
                      <td className="px-5 py-3 text-xs whitespace-nowrap" style={{ color: "var(--muted-foreground)" }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: isUnlock ? "oklch(0.65 0.16 155 / 15%)" : "oklch(0.55 0.2 265 / 15%)",
                            color: isUnlock ? "oklch(0.65 0.16 155)" : "oklch(0.75 0.15 265)",
                          }}>
                          {log.entityType}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {goal ? (
                          <>
                            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{goal.title}</p>
                            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{goal.employee.name} · {goal.status}</p>
                          </>
                        ) : (
                          <span className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>{log.entityId.slice(0, 8)}…</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>
                        {userMap[log.changedBy] || "Unknown"}
                      </td>
                      <td className="px-5 py-3 text-xs max-w-xs" style={{ color: "oklch(0.65 0.16 155)" }}>
                        {summary}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}


