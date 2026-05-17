CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "managerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

CREATE TABLE IF NOT EXISTS "Goal" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thrustArea" TEXT,
    "uom" TEXT NOT NULL,
    "target" DOUBLE PRECISION NOT NULL,
    "weightage" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Checkin" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "quarter" TEXT NOT NULL,
    "achievement" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "comment" TEXT,
    "managerComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Checkin_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Checkin_goalId_quarter_key" ON "Checkin"("goalId", "quarter");

CREATE TABLE IF NOT EXISTS "SharedGoal" (
    "id" TEXT NOT NULL,
    "masterGoalId" TEXT NOT NULL,
    "employeeGoalId" TEXT NOT NULL,
    "primaryOwnerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SharedGoal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_managerId_fkey";
ALTER TABLE "User" ADD CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Goal" DROP CONSTRAINT IF EXISTS "Goal_employeeId_fkey";
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Checkin" DROP CONSTRAINT IF EXISTS "Checkin_goalId_fkey";
ALTER TABLE "Checkin" ADD CONSTRAINT "Checkin_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
