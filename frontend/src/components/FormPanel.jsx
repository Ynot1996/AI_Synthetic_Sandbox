const PRODUCT_TYPES = [
  { value: 'buy-now-pay-later',  label: 'Buy Now, Pay Later (BNPL)' },
  { value: 'high-interest-loan', label: 'High-Interest Personal Loan' },
  { value: 'credit-card',        label: 'Credit Card' },
  { value: 'payday-loan',        label: 'Payday Loan' },
  { value: 'investment-product', label: 'Investment Product' },
  { value: 'insurance',          label: 'Insurance Policy' },
]

const AGE_GROUPS = ['18–25', '26–40', '41–60', '60+']

const VERDICT = {
  LOW_RISK:    { color: '#00d4aa', label: 'LOW RISK' },
  MEDIUM_RISK: { color: '#facc15', label: 'MEDIUM RISK' },
  HIGH_RISK:   { color: '#fb923c', label: 'HIGH RISK' },
  CRITICAL:    { color: '#f87171', label: 'CRITICAL' },
}

// Per-product-category sensible defaults, seeded on product switch
export const CATEGORY_DEFAULTS = {
  credit:     { apr: 39.9 },
  insurance:  { annualPremium: 600, claimsRejectionRate: 0.18, exclusionRatio: 0.40 },
  investment: { annualFeePct: 1.5, riskRating: 5 },
}

export function categoryOf(productType) {
  if (productType === 'insurance') return 'insurance'
  if (productType === 'investment-product') return 'investment'
  return 'credit'
}

function seedDefaults(cat, prev) {
  const d = CATEGORY_DEFAULTS[cat] || {}
  const out = {}
  for (const k in d) if (prev[k] == null) out[k] = d[k]
  return out
}

// ── Reusable range row ─────────────────────────────────────────────────────────
function Slider({ label, value, display, min, max, step, color, onChange }) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-2.5">
        <label className="text-[10px] text-white/35 tracking-wide">{label}</label>
        <span className="text-base font-light" style={{ color }}>{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
             onChange={e => onChange(parseFloat(e.target.value))}
             className="w-full h-px appearance-none cursor-pointer"
             style={{ accentColor: color, background: 'rgba(255,255,255,0.08)' }} />
    </div>
  )
}

export default function FormPanel({ params, setParams, onRun, isRunning, progress, summary }) {
  const v   = summary ? (VERDICT[summary.compliance_verdict] ?? VERDICT.MEDIUM_RISK) : null
  const cat = categoryOf(params.productType)
  const set = patch => setParams(p => ({ ...p, ...patch }))

  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-5">
      <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-white/25">
        Product Parameters
      </p>

      {/* Product type */}
      <div>
        <label className="block text-[10px] text-white/35 mb-2 tracking-wide">Product Type</label>
        <select
          value={params.productType}
          onChange={e => {
            const pt = e.target.value
            setParams(p => ({ ...p, productType: pt, ...seedDefaults(categoryOf(pt), p) }))
          }}
          className="w-full rounded-xl px-3 py-2.5 text-xs text-white/80 cursor-pointer focus:outline-none transition"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {PRODUCT_TYPES.map(pt => (
            <option key={pt.value} value={pt.value} style={{ background: '#111' }}>{pt.label}</option>
          ))}
        </select>
      </div>

      {/* ── Cost / harm drivers — vary by product category ── */}
      {cat === 'credit' && (
        <Slider label="Annual Percentage Rate" value={params.apr ?? 39.9}
                display={`${(params.apr ?? 39.9).toFixed(1)}%`} min={0} max={300} step={0.5}
                color="#4f9cf9" onChange={apr => set({ apr })} />
      )}

      {cat === 'insurance' && (
        <>
          <Slider label="Annual Premium" value={params.annualPremium ?? 600}
                  display={`£${Math.round(params.annualPremium ?? 600)}`} min={0} max={2000} step={10}
                  color="#4f9cf9" onChange={annualPremium => set({ annualPremium })} />
          <Slider label="Claims Rejection Rate" value={params.claimsRejectionRate ?? 0.18}
                  display={`${Math.round((params.claimsRejectionRate ?? 0.18) * 100)}%`} min={0} max={1} step={0.01}
                  color="#fb923c" onChange={claimsRejectionRate => set({ claimsRejectionRate })} />
          <Slider label="Exclusion Breadth" value={params.exclusionRatio ?? 0.40}
                  display={`${Math.round((params.exclusionRatio ?? 0.40) * 100)}%`} min={0} max={1} step={0.01}
                  color="#facc15" onChange={exclusionRatio => set({ exclusionRatio })} />
        </>
      )}

      {cat === 'investment' && (
        <>
          <Slider label="Ongoing Annual Charge" value={params.annualFeePct ?? 1.5}
                  display={`${(params.annualFeePct ?? 1.5).toFixed(2)}%`} min={0} max={5} step={0.05}
                  color="#4f9cf9" onChange={annualFeePct => set({ annualFeePct })} />
          <div>
            <label className="block text-[10px] text-white/35 mb-2.5 tracking-wide">Risk Rating (SRRI 1–7)</label>
            <div className="grid grid-cols-7 gap-1">
              {[1, 2, 3, 4, 5, 6, 7].map(r => {
                const active = (params.riskRating ?? 5) === r
                return (
                  <button key={r} onClick={() => set({ riskRating: r })}
                          className="py-2 rounded-lg text-[11px] font-medium transition-all"
                          style={{
                            background: active ? 'rgba(79,156,249,0.2)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${active ? 'rgba(79,156,249,0.4)' : 'rgba(255,255,255,0.07)'}`,
                            color: active ? '#4f9cf9' : 'rgba(255,255,255,0.35)',
                          }}>
                    {r}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Age group (shared) */}
      <div>
        <label className="block text-[10px] text-white/35 mb-2.5 tracking-wide">Target Age Group</label>
        <div className="grid grid-cols-4 gap-1.5">
          {AGE_GROUPS.map(ag => (
            <button key={ag} onClick={() => set({ ageGroup: ag })}
                    className="py-2 rounded-lg text-[10px] font-medium transition-all"
                    style={{
                      background: params.ageGroup === ag ? 'rgba(79,156,249,0.2)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${params.ageGroup === ag ? 'rgba(79,156,249,0.4)' : 'rgba(255,255,255,0.07)'}`,
                      color: params.ageGroup === ag ? '#4f9cf9' : 'rgba(255,255,255,0.35)',
                    }}>
              {ag}
            </button>
          ))}
        </div>
      </div>

      {/* Vulnerable ratio (shared) */}
      <Slider label="Vulnerable Population" value={params.vulnerableRatio}
              display={`${Math.round(params.vulnerableRatio * 100)}%`} min={0} max={1} step={0.01}
              color="#fb923c" onChange={vulnerableRatio => set({ vulnerableRatio })} />

      {/* Run button */}
      <button onClick={onRun} disabled={isRunning}
              className="mt-1 w-full py-3 rounded-xl text-xs font-medium tracking-widest uppercase transition-all"
              style={{
                background: isRunning ? 'rgba(255,255,255,0.04)' : '#4f9cf9',
                color: isRunning ? 'rgba(255,255,255,0.2)' : '#fff',
                cursor: isRunning ? 'not-allowed' : 'pointer',
                boxShadow: isRunning ? 'none' : '0 4px 24px rgba(79,156,249,0.2)',
              }}>
        {isRunning ? `Simulating… ${progress}%` : '▶  Run Simulation'}
      </button>

      {/* Verdict */}
      {summary && v && (
        <div className="rounded-xl p-4 animate-fadeUp"
             style={{ background: `${v.color}10`, border: `1px solid ${v.color}28` }}>
          <div className="text-[9px] font-bold uppercase tracking-widest mb-3"
               style={{ color: v.color }}>
            {v.label}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[9px] text-white/20 mb-1">Peak Risk</div>
              <div className="text-xl font-light" style={{ color: v.color }}>{summary.peak_risk_score}</div>
            </div>
            <div>
              <div className="text-[9px] text-white/20 mb-1">Peak Day</div>
              <div className="text-xl font-light text-white/70">#{summary.peak_risk_day}</div>
            </div>
            <div className="col-span-2">
              <div className="text-[9px] text-white/20 mb-1">Total Complaints (90d)</div>
              <div className="text-xl font-light text-white/70">{summary.total_complaints.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
