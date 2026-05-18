import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Sidebar from "@/components/layout/sidebar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden dashboard-canvas">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto scroll-smooth">
        {children}
      </main>
    </div>
  )
}
