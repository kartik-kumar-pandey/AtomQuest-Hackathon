/** Progress score formulas per BRD (tracking only, not ratings). */
export function computeScore(uom: string, target: number, achievement: number): number {
  if (uom === "ZERO") return achievement === 0 ? 100 : 0
  if (uom === "MAX") return target === 0 ? 0 : Math.min(100, (target / achievement) * 100)
  if (uom === "TIMELINE") {
    // Target = deadline (YYYYMMDD), achievement = completion date (YYYYMMDD)
    if (target <= 0 || achievement <= 0) return 0
    return achievement <= target ? 100 : 0
  }
  return target === 0 ? 0 : Math.min(100, (achievement / target) * 100)
}

export function validateWeightageTotal(weightages: number[]): { ok: boolean; total: number; error?: string } {
  const total = weightages.reduce((s, w) => s + w, 0)
  if (Math.round(total) !== 100) {
    return { ok: false, total, error: `Total weightage must equal 100%. Currently: ${total}%` }
  }
  return { ok: true, total }
}

export function validateMinWeightage(weightage: number): { ok: boolean; error?: string } {
  if (Number(weightage) < 10) {
    return { ok: false, error: "Minimum weightage per goal is 10%." }
  }
  return { ok: true }
}
