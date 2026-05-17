/**
 * Sets up Neon schema via WebSocket (no TCP port 5432). Run: npm run db:setup
 * Add --seed for demo data.
 */
import { config } from "dotenv"
import { resolve } from "path"
import { readFileSync } from "fs"
import { Pool, neonConfig } from "@neondatabase/serverless"
import ws from "ws"
import { createPrismaClient } from "../src/lib/prisma"

config({ path: resolve(process.cwd(), ".env.local") })
config({ path: resolve(process.cwd(), ".env") })

neonConfig.webSocketConstructor = ws

async function applySchema() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL missing in .env.local")

  console.log("→ Connecting to Neon (WebSocket)...")
  const pool = new Pool({ connectionString: url })

  try {
    const ping = await pool.query("SELECT 1 AS ok")
    console.log("✓ Neon reachable:", ping.rows[0])

    const ddl = readFileSync(resolve(process.cwd(), "prisma/neon-init.sql"), "utf8")
    console.log("→ Applying schema (prisma/neon-init.sql)...")
    await pool.query(ddl)
    console.log("✓ Schema applied")
  } finally {
    await pool.end()
  }
}

async function verifyPrisma() {
  const prisma = createPrismaClient()
  const count = await prisma.user.count()
  console.log(`✓ Prisma client OK — ${count} user(s) in database`)
  await prisma.$disconnect()
}

async function main() {
  const seed = process.argv.includes("--seed")

  await applySchema()
  await verifyPrisma()

  if (seed) {
    console.log("→ Seeding demo data...")
    const { execSync } = await import("child_process")
    execSync("npx tsx prisma/seed.ts", { stdio: "inherit", cwd: process.cwd() })
  } else {
    console.log("\nTip: npm run db:setup:seed  — loads demo users (password: password)")
  }
}

main().catch(err => {
  console.error("\n✗ Setup failed:", err instanceof Error ? err.message : err)
  process.exit(1)
})
