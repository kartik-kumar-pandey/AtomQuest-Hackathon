import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

const handler = NextAuth(authOptions)

export async function GET(req: NextRequest, { params }: { params: any }) {
  return handler(req, { params })
}

export async function POST(req: NextRequest, { params }: { params: any }) {
  return handler(req, { params })
}
