export function formatAuditEntry(oldValue: string | null, newValue: string | null): string {
  try {
    const parsed = newValue ? JSON.parse(newValue) : {}
    const action = parsed.action as string | undefined
    if (action === "ADMIN_UNLOCK") return "Admin unlocked goal (LOCKED → APPROVED)"
    if (action === "ADMIN_LOCK") return "Admin locked goal"
    if (action === "GOAL_LOCKED") return "Manager approved & locked goal"
    if (action === "GOAL_REJECTED") return "Manager returned goal for rework"
    if (action === "GOAL_SUBMITTED") return "Employee submitted goal"
    if (action === "GOAL_APPROVED") return "Goal approved"
    if (action === "CHECKIN_UPDATED") return "Check-in updated"
    if (action === "MANAGER_COMMENT") return "Manager added check-in comment"
    if (parsed.status) return `Status: ${parsed.status}`
    return newValue?.slice(0, 80) ?? "—"
  } catch {
    return newValue ?? "—"
  }
}
