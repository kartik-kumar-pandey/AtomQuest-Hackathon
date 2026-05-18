/** Quarterly windows per BRD section 2.3 */
export const CYCLE_SCHEDULE = [
  { id: "GOAL_SETTING", period: "Phase 1 — Goal Setting", window: "1st May", months: [5], action: "Goal Creation, Submission & Approval" },
  { id: "Q1", period: "Q1 Check-in", window: "July", months: [7], action: "Progress Update — Planned vs. Actual" },
  { id: "Q2", period: "Q2 Check-in", window: "October", months: [10], action: "Progress Update — Planned vs. Actual" },
  { id: "Q3", period: "Q3 Check-in", window: "January", months: [1], action: "Progress Update — Planned vs. Actual" },
  { id: "Q4", period: "Q4 / Annual", window: "March / April", months: [3, 4], action: "Final Achievement Capture" },
]

export type QuarterId = "Q1" | "Q2" | "Q3" | "Q4"

const QUARTER_MONTHS: Record<QuarterId, number[]> = {
  Q1: [7],
  Q2: [10],
  Q3: [1],
  Q4: [3, 4],
}

export function isCycleEnforced(): boolean {
  return process.env.CYCLE_ENFORCE === "true"
}

export function isGoalSettingOpen(date = new Date()): boolean {
  if (!isCycleEnforced()) return true
  return CYCLE_SCHEDULE.find(s => s.id === "GOAL_SETTING")!.months.includes(date.getMonth() + 1)
}

export function isCheckinOpen(quarter: string, date = new Date()): boolean {
  if (!isCycleEnforced()) return true
  const months = QUARTER_MONTHS[quarter as QuarterId]
  if (!months) return false
  return months.includes(date.getMonth() + 1)
}

export function getActivePhase(date = new Date()): (typeof CYCLE_SCHEDULE)[number] | null {
  const month = date.getMonth() + 1
  return CYCLE_SCHEDULE.find(s => s.months.includes(month)) ?? null
}

export function getCheckinWindowLabel(quarter: string): string {
  const entry = CYCLE_SCHEDULE.find(s => s.id === quarter)
  return entry ? entry.window : quarter
}

/** Admin bypasses cycle gates; employees/managers are gated when enforcement is on. */
export function canBypassCycle(role: string): boolean {
  return role === "ADMIN"
}
