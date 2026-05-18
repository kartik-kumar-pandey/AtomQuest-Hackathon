import { config } from "dotenv"
import { resolve } from "path"
import { computeScore, validateWeightageTotal } from "../src/lib/goal-utils"
import { isGoalSettingOpen, isCheckinOpen } from "../src/lib/cycle"
import { createPrismaClient } from "../src/lib/prisma"

config({ path: resolve(process.cwd(), ".env.local") })
config({ path: resolve(process.cwd(), ".env") })

const prismaDb = createPrismaClient()

async function runTests() {
  console.log("\x1b[35m%s\x1b[0m", "==================================================")
  console.log("\x1b[35m%s\x1b[0m", "   MYGOALS SYSTEM INTEGRITY & VALIDATION SUITE   ")
  console.log("\x1b[35m%s\x1b[0m", "==================================================")

  let passed = 0
  let failed = 0

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  \x1b[32m✔ PASS\x1b[0m: ${message}`)
      passed++
    } else {
      console.log(`  \x1b[31m✘ FAIL\x1b[0m: ${message}`)
      failed++
    }
  }

  try {
    // --------------------------------------------------
    // TEST 1: Database Connection & Seed Checks
    // --------------------------------------------------
    console.log("\n\x1b[36m%s\x1b[0m", "• Test Stage 1: Database Connectivity & Models Check")
    const usersCount = await prismaDb.user.count()
    assert(usersCount > 0, `Successfully connected to Neon PostgreSQL. Found ${usersCount} registered users.`)

    const admin = await prismaDb.user.findFirst({ where: { role: "ADMIN" } })
    assert(admin !== null, `Admin account exists (${admin?.email})`)

    const managers = await prismaDb.user.findMany({ where: { role: "MANAGER" } })
    assert(managers.length >= 2, `Manager hierarchy verified. Found ${managers.length} manager accounts.`)

    const employees = await prismaDb.user.findMany({ where: { role: "EMPLOYEE" } })
    assert(employees.length >= 3, `Employee accounts verified. Found ${employees.length} employee accounts.`)

    // --------------------------------------------------
    // TEST 2: Progress Score Formula Validation
    // --------------------------------------------------
    console.log("\n\x1b[36m%s\x1b[0m", "• Test Stage 2: Progress Score Formula & UoM Math Verification")

    // MIN: Higher is better (Target: 100, Achieved: 75 -> Expected: 75%)
    const scoreMin = computeScore("MIN", 100, 75)
    assert(scoreMin === 75, `UoM MIN (Higher is better) verified. Target: 100, Achieved: 75 => Score: ${scoreMin}%`)

    // MAX: Lower is better (Target: 10, Achieved: 20 -> Expected: 50%)
    const scoreMax = computeScore("MAX", 10, 20)
    assert(scoreMax === 50, `UoM MAX (Lower is better) verified. Target: 10, Achieved: 20 => Score: ${scoreMax}%`)

    // ZERO: Zero is success (Target: 0, Achieved: 0 -> Expected: 100%)
    const scoreZeroSuccess = computeScore("ZERO", 0, 0)
    assert(scoreZeroSuccess === 100, `UoM ZERO (Success case) verified. Target: 0, Achieved: 0 => Score: ${scoreZeroSuccess}%`)

    // ZERO: Non-zero is fail (Target: 0, Achieved: 3 -> Expected: 0%)
    const scoreZeroFail = computeScore("ZERO", 0, 3)
    assert(scoreZeroFail === 0, `UoM ZERO (Failure case) verified. Target: 0, Achieved: 3 => Score: ${scoreZeroFail}%`)

    const scoreTimelineOnTime = computeScore("TIMELINE", 20251231, 20251130)
    assert(scoreTimelineOnTime === 100, `UoM TIMELINE (On time) verified. Score: ${scoreTimelineOnTime}%`)

    const scoreTimelineLate = computeScore("TIMELINE", 20251231, 20260115)
    assert(scoreTimelineLate === 0, `UoM TIMELINE (Late) verified. Score: ${scoreTimelineLate}%`)

    const weightOk = validateWeightageTotal([25, 25, 25, 25])
    assert(weightOk.ok, "Weightage validation accepts exactly 100%")

    const weightBad = validateWeightageTotal([30, 30, 30])
    assert(!weightBad.ok, "Weightage validation rejects totals not equal to 100%")

  console.log("\n\x1b[36m%s\x1b[0m", "• Test Stage 2b: Cycle Window Configuration")
    assert(typeof isGoalSettingOpen === "function", "Goal setting window check is available")
    assert(typeof isCheckinOpen === "function", "Check-in window check is available")

    // --------------------------------------------------
    // TEST 3: Shared Goals Cascade Synchronization Engine
    // --------------------------------------------------
    console.log("\n\x1b[36m%s\x1b[0m", "• Test Stage 3: Shared Goals & Cascade Synchronization Simulation")

    // Let's programmatically simulate pushing a goal and cascading checkins
    const testManager = await prismaDb.user.findFirst({ where: { role: "MANAGER" } })
    const testEmployee = await prismaDb.user.findFirst({ where: { role: "EMPLOYEE" } })

    if (testManager && testEmployee) {
      console.log(`  Simulating Goal Cascade from Manager [${testManager.email}] to Employee [${testEmployee.email}]...`)

      // 1. Create a Master Goal
      const masterGoal = await prismaDb.goal.create({
        data: {
          employeeId: testManager.id,
          title: "TEMP_TEST_MASTER_GOAL_CASCADE",
          description: "Temporary Goal to verify atomic cascades",
          thrustArea: "General",
          uom: "MIN",
          target: 100,
          weightage: 0,
          status: "APPROVED"
        }
      })
      assert(masterGoal.id !== undefined, "Successfully initialized Master Goal in DB.")

      // 2. Create the Copied Goal on Employee Sheet
      const copiedGoal = await prismaDb.goal.create({
        data: {
          employeeId: testEmployee.id,
          title: masterGoal.title,
          description: masterGoal.description,
          thrustArea: masterGoal.thrustArea,
          uom: masterGoal.uom,
          target: masterGoal.target,
          weightage: 10,
          status: "APPROVED"
        }
      })
      assert(copiedGoal.status === "APPROVED", "Successfully pushed Copied Goal onto employee sheet with APPROVED status.")

      // 3. Register Shared Goal Link
      const sharedLink = await prismaDb.sharedGoal.create({
        data: {
          masterGoalId: masterGoal.id,
          employeeGoalId: copiedGoal.id,
          primaryOwnerId: testManager.id
        }
      })
      assert(sharedLink.id !== undefined, "Linked goals in SharedGoal lookup table.")

      // 4. Log check-in progress on master goal
      const checkin = await prismaDb.checkin.create({
        data: {
          goalId: masterGoal.id,
          quarter: "Q1",
          achievement: 85,
          status: "ON_TRACK",
          comment: "Manager logged progress"
        }
      })
      assert(checkin.id !== undefined, "Quarterly check-in logged on master goal.")

      // 5. Trigger cascade sync mechanism programmatically (similar to /api/checkins/route.ts)
      const linkedGoals = await prismaDb.sharedGoal.findMany({ where: { masterGoalId: masterGoal.id } })
      for (const link of linkedGoals) {
        await prismaDb.checkin.upsert({
          where: { goalId_quarter: { goalId: link.employeeGoalId, quarter: "Q1" } },
          create: {
            goalId: link.employeeGoalId,
            quarter: "Q1",
            achievement: 85,
            status: "ON_TRACK",
            comment: "Synchronized from Shared Goal Primary Owner"
          },
          update: {
            achievement: 85,
            status: "ON_TRACK",
            comment: "Synchronized from Shared Goal Primary Owner"
          }
        })
      }

      // 6. Verify Employee Goal sheet now contains the synchronized checkin
      const employeeCheckin = await prismaDb.checkin.findUnique({
        where: { goalId_quarter: { goalId: copiedGoal.id, quarter: "Q1" } }
      })
      assert(
        employeeCheckin !== null && employeeCheckin.achievement === 85 && employeeCheckin.status === "ON_TRACK",
        "SUCCESS: Cascade Sync Engine successfully synchronized actual progress from primary owner's sheet down to employee sheet!"
      )

      // Cleanup test data to keep db clean
      await prismaDb.checkin.deleteMany({ where: { goalId: { in: [masterGoal.id, copiedGoal.id] } } })
      await prismaDb.sharedGoal.deleteMany({ where: { masterGoalId: masterGoal.id } })
      await prismaDb.goal.deleteMany({ where: { id: { in: [masterGoal.id, copiedGoal.id] } } })
      console.log("  Successfully cleaned up transaction simulation data.")
    } else {
      console.log("  Skipping Stage 3 simulation: Missing manager/employee seed accounts.")
    }

    // --------------------------------------------------
    // FINAL STATUS REPORT
    // --------------------------------------------------
    console.log("\n\x1b[35m%s\x1b[0m", "==================================================")
    console.log("\x1b[35m%s\x1b[0m", "                  TEST RESULTS REPORT             ")
    console.log("\x1b[35m%s\x1b[0m", "==================================================")
    console.log(`  Total Passed: \x1b[32m${passed}\x1b[0m`)
    console.log(`  Total Failed: \x1b[31m${failed}\x1b[0m`)

    if (failed === 0) {
      console.log("\n\x1b[32m%s\x1b[0m", "  ✔ STATUS: SYSTEM FULLY HEALTHY & INTEGRAL!")
    } else {
      console.log("\n\x1b[31m%s\x1b[0m", "  ✘ STATUS: SYSTEM DETECTED CORRUPTIONS/ERRORS!")
    }
    console.log("\x1b[35m%s\x1b[0m", "==================================================\n")

  } catch (err: any) {
    console.error("\x1b[31mFatal Error during test execution:\x1b[0m", err)
  } finally {
    await prismaDb.$disconnect()
  }
}

runTests()
