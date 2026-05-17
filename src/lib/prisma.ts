import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import { neonConfig } from "@neondatabase/serverless"
import ws from "ws"

neonConfig.webSocketConstructor = ws

function getConnectionString() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error("DATABASE_URL is not set. Add your Neon connection string to .env.local")
  }
  return url
}

/** Prisma client over Neon WebSockets (works when port 5432 is blocked). */
export function createPrismaClient() {
  const connectionString = getConnectionString()
  const adapter = new PrismaNeon({ connectionString })
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })
}
