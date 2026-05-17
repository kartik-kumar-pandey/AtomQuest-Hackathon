import { config } from "dotenv"
import { resolve } from "path"
import { createPrismaClient } from "../src/lib/prisma"

config({ path: resolve(process.cwd(), ".env.local") })
config({ path: resolve(process.cwd(), ".env") })

async function main() {
  const prisma = createPrismaClient()
  const users = await prisma.user.count()
  const goals = await prisma.goal.count()
  console.log({ users, goals, ok: true })
  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
