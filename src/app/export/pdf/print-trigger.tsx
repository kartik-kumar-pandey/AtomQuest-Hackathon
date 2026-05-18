"use client"

import { useEffect } from "react"
import Link from "next/link"

export function PrintControls({ role }: { role: string }) {
  useEffect(() => {
    // We delay slightly (e.g. 800ms) to make sure the page completes layout painting
    const timer = setTimeout(() => {
      if (typeof window !== "undefined") {
        window.print()
      }
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="no-print max-w-7xl mx-auto mb-8 bg-white p-4 rounded-2xl border border-slate-100 shadow-md flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link 
          href={role === "ADMIN" ? "/admin/dashboard" : "/manager/dashboard"}
          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
        >
          ← Back to Dashboard
        </Link>
        <span className="text-sm text-slate-400 font-medium">|</span>
        <p className="text-xs text-slate-500 font-medium">
          This page has automatically requested your browser's PDF Print dialog. If it didn't open, use the button on the right.
        </p>
      </div>
      <button
        onClick={() => {
          if (typeof window !== "undefined") window.print()
        }}
        className="cursor-pointer px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:shadow-lg hover:shadow-indigo-500/20 rounded-xl transition-all"
      >
        🖨️ Print / Save PDF
      </button>
    </div>
  )
}
