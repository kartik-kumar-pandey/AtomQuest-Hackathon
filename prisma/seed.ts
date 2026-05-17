import { config } from "dotenv"
import { resolve } from "path"
import bcrypt from "bcryptjs"
import { createPrismaClient } from "../src/lib/prisma"

config({ path: resolve(process.cwd(), ".env.local") })
config({ path: resolve(process.cwd(), ".env") })

const prisma = createPrismaClient()

async function main() {
  const password = await bcrypt.hash("password", 10)

  // Clear existing
  await prisma.auditLog.deleteMany()
  await prisma.checkin.deleteMany()
  await prisma.sharedGoal.deleteMany()
  await prisma.goal.deleteMany()
  await prisma.user.deleteMany()

  // 1. Create Admin
  const admin = await prisma.user.create({
    data: { name: "Admin User", email: "admin@atomberg.com", password, role: "ADMIN" },
  })

  // 2. Create Managers
  const manager1 = await prisma.user.create({
    data: { name: "Rohan Sharma", email: "manager1@atomberg.com", password, role: "MANAGER" },
  })
  const manager2 = await prisma.user.create({
    data: { name: "Priya Mehta", email: "manager2@atomberg.com", password, role: "MANAGER" },
  })

  // 3. Create Employees
  const emp1 = await prisma.user.create({
    data: { name: "Backend Dev", email: "emp1@atomberg.com", password, role: "EMPLOYEE", managerId: manager1.id },
  })
  const emp2 = await prisma.user.create({
    data: { name: "Frontend Dev", email: "emp2@atomberg.com", password, role: "EMPLOYEE", managerId: manager1.id },
  })
  const emp3 = await prisma.user.create({
    data: { name: "Sales Exec", email: "emp3@atomberg.com", password, role: "EMPLOYEE", managerId: manager2.id },
  })

  // 4. Create Goals for emp1 (all APPROVED for demo)
  const goalsEmp1 = await Promise.all([
    prisma.goal.create({ data: { employeeId: emp1.id, title: "Improve API response time", description: "Reduce P95 latency below 200ms", thrustArea: "Engineering", uom: "MIN", target: 200, weightage: 25, status: "APPROVED" } }),
    prisma.goal.create({ data: { employeeId: emp1.id, title: "Reduce bug count", description: "Reduce production bugs by 15%", thrustArea: "Engineering", uom: "MAX", target: 15, weightage: 20, status: "APPROVED" } }),
    prisma.goal.create({ data: { employeeId: emp1.id, title: "Complete 3 optimization initiatives", thrustArea: "Engineering", uom: "MIN", target: 3, weightage: 20, status: "APPROVED" } }),
    prisma.goal.create({ data: { employeeId: emp1.id, title: "Zero critical security incidents", thrustArea: "Engineering", uom: "ZERO", target: 0, weightage: 15, status: "APPROVED" } }),
    prisma.goal.create({ data: { employeeId: emp1.id, title: "Complete AWS certification", thrustArea: "Engineering", uom: "MIN", target: 1, weightage: 20, status: "SUBMITTED" } }),
  ])

  // 5. Create Goals for emp2 (mix of statuses)
  const goalsEmp2 = await Promise.all([
    prisma.goal.create({ data: { employeeId: emp2.id, title: "Reduce page load time", thrustArea: "Engineering", uom: "MAX", target: 3, weightage: 30, status: "APPROVED" } }),
    prisma.goal.create({ data: { employeeId: emp2.id, title: "Implement 5 new UI components", thrustArea: "Product", uom: "MIN", target: 5, weightage: 30, status: "APPROVED" } }),
    prisma.goal.create({ data: { employeeId: emp2.id, title: "Achieve 90% test coverage", thrustArea: "Engineering", uom: "MIN", target: 90, weightage: 25, status: "APPROVED" } }),
    prisma.goal.create({ data: { employeeId: emp2.id, title: "Zero accessibility violations", thrustArea: "Product", uom: "ZERO", target: 0, weightage: 15, status: "DRAFT" } }),
  ])

  // 6. Create Goals for emp3
  const goalsEmp3 = await Promise.all([
    prisma.goal.create({ data: { employeeId: emp3.id, title: "Achieve sales target of ₹50L", thrustArea: "Sales", uom: "MIN", target: 5000000, weightage: 40, status: "APPROVED" } }),
    prisma.goal.create({ data: { employeeId: emp3.id, title: "Onboard 10 new clients", thrustArea: "Sales", uom: "MIN", target: 10, weightage: 30, status: "APPROVED" } }),
    prisma.goal.create({ data: { employeeId: emp3.id, title: "Customer satisfaction score", thrustArea: "Customer Success", uom: "MIN", target: 90, weightage: 30, status: "SUBMITTED" } }),
  ])

  // 7. Create Check-ins for emp1 approved goals
  const checkinData = [
    // Goal 1: API response time (target 200ms, lower is better → UoM=MIN actually means higher achievement is better, but for latency we track actual ms)
    { goalId: goalsEmp1[0].id, quarter: "Q1", achievement: 280, status: "ON_TRACK", comment: "Good progress, still optimizing caching layer" },
    { goalId: goalsEmp1[0].id, quarter: "Q2", achievement: 210, status: "ON_TRACK", comment: "Redis cache implemented" },
    // Goal 2: Bug count reduction
    { goalId: goalsEmp1[1].id, quarter: "Q1", achievement: 8, status: "ON_TRACK", comment: "Reduced 8% so far" },
    { goalId: goalsEmp1[1].id, quarter: "Q2", achievement: 14, status: "COMPLETED", comment: "Nearly at target!" },
    // Goal 3: Optimization initiatives
    { goalId: goalsEmp1[2].id, quarter: "Q1", achievement: 1, status: "ON_TRACK", comment: "First initiative completed" },
    { goalId: goalsEmp1[2].id, quarter: "Q2", achievement: 2, status: "ON_TRACK", comment: "Database query optimizer done" },
    // Goal 4: Security incidents
    { goalId: goalsEmp1[3].id, quarter: "Q1", achievement: 0, status: "COMPLETED", comment: "Zero incidents!" },
    { goalId: goalsEmp1[3].id, quarter: "Q2", achievement: 0, status: "COMPLETED", comment: "Maintained zero incidents" },
  ]

  for (const c of checkinData) {
    await prisma.checkin.create({ data: c })
  }

  // Check-ins for emp2
  const checkinData2 = [
    { goalId: goalsEmp2[0].id, quarter: "Q1", achievement: 4.2, status: "ON_TRACK", comment: "Implemented lazy loading" },
    { goalId: goalsEmp2[0].id, quarter: "Q2", achievement: 2.8, status: "COMPLETED", comment: "Under target!" },
    { goalId: goalsEmp2[1].id, quarter: "Q1", achievement: 3, status: "ON_TRACK", comment: "3 components shipped" },
    { goalId: goalsEmp2[2].id, quarter: "Q1", achievement: 72, status: "ON_TRACK", comment: "Working on it" },
    { goalId: goalsEmp2[2].id, quarter: "Q2", achievement: 85, status: "ON_TRACK", comment: "Getting close!" },
  ]

  for (const c of checkinData2) {
    await prisma.checkin.create({ data: c })
  }

  // Check-ins for emp3
  const checkinData3 = [
    { goalId: goalsEmp3[0].id, quarter: "Q1", achievement: 1200000, status: "ON_TRACK", comment: "Strong Q1 pipeline" },
    { goalId: goalsEmp3[0].id, quarter: "Q2", achievement: 2800000, status: "ON_TRACK", comment: "On track for H1 target" },
    { goalId: goalsEmp3[1].id, quarter: "Q1", achievement: 3, status: "ON_TRACK", comment: "3 clients onboarded" },
    { goalId: goalsEmp3[1].id, quarter: "Q2", achievement: 7, status: "ON_TRACK" },
  ]

  for (const c of checkinData3) {
    await prisma.checkin.create({ data: c })
  }

  // Audit logs for demo
  await prisma.auditLog.create({
    data: { entityType: "Goal", entityId: goalsEmp1[0].id, changedBy: manager1.id, oldValue: JSON.stringify({ status: "SUBMITTED" }), newValue: JSON.stringify({ status: "APPROVED" }) }
  })
  await prisma.auditLog.create({
    data: { entityType: "Goal", entityId: goalsEmp2[0].id, changedBy: manager1.id, oldValue: JSON.stringify({ target: 5 }), newValue: JSON.stringify({ target: 3 }), }
  })

  console.log("✅ Database seeded with rich demo data!")
  console.log("\nDemo accounts (password: password):")
  console.log("  Admin:    admin@atomberg.com")
  console.log("  Manager:  manager1@atomberg.com  |  manager2@atomberg.com")
  console.log("  Employee: emp1@atomberg.com  |  emp2@atomberg.com  |  emp3@atomberg.com")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
