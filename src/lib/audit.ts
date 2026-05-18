import { db } from "@/lib/db"

export type AuditAction =
  | "GOAL_SUBMITTED"
  | "GOAL_APPROVED"
  | "GOAL_REJECTED"
  | "GOAL_LOCKED"
  | "ADMIN_UNLOCK"
  | "ADMIN_LOCK"
  | "GOAL_EDITED"
  | "CHECKIN_UPDATED"
  | "MANAGER_COMMENT"
  | "PROGRESS_UPDATED"

export async function logAudit(
  entityType: string,
  entityId: string,
  changedBy: string,
  action: AuditAction,
  oldValue: unknown,
  newValue: unknown,
) {
  await db.auditLog.create({
    data: {
      entityType,
      entityId,
      changedBy,
      oldValue: JSON.stringify({ action, ...(typeof oldValue === "object" && oldValue ? oldValue : { value: oldValue }) }),
      newValue: JSON.stringify({ action, ...(typeof newValue === "object" && newValue ? newValue : { value: newValue }) }),
    },
  })
}

export { formatAuditEntry } from "@/lib/audit-format"
