const PRODUCT_TYPES = [
  { value: 'buy-now-pay-later',  label: 'Buy Now, Pay Later (BNPL)' },
  { value: 'high-interest-loan', label: 'High-Interest Personal Loan' },
  { value: 'credit-card',        label: 'Credit Card' },
  { value: 'payday-loan',        label: 'Payday Loan' },
  { value: 'investment-product', label: 'Investment Product' },
  { value: 'insurance',          label: 'Insurance Product' },
]

const AGE_GROUPS = ['18–25', '26–40', '41–60', '60+']

const VERDICT = {
  LOW_RISK:    { color: '#00d4aa', label: 'LOW RISK' },
  MEDIUM_RISK: { color: '#facc15', label: 'MEDIUM RISK' },
  HIGH_RISK:   { color: '#fb923c', label: 'HIGH RISK' },
  CRITICAL:    { color: '#f87171', label: 'CRITICAL' },
}

export default function FormPanel({ params, setParams, onRun, isRunning, progress, summary }) {
  const v = summary ? (VERDICT[summary.compliance_verdict] ?? VERDICT.MEDIUM_RISK) : null

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
          onChange={e => setParams(p => ({ ...p, productType: e.target.value }))}
          className="w-full rounded-xl px-3 py-2.5 text-xs text-white/80 cursor-pointer focus:outline-none transition"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {PRODUCT_TYPES.map(pt => (
            <option key={pt.value} value={pt.value} style={{ background: '#111' }}>{pt.label}</option>
          ))}
        </select>
      </div>

      {/* APR */}
      <div>
        <div className="flex justify-between items-baseline mb-2.5">
          <label className="text-[10px] text-white/35 tracking-wide">Annual Percentage Rate</label>
          <span className="text-base font-light text-[#4f9cf9]">{params.apr.toFixed(1)}%</span>
        </div>
        <input type="range" min="0" max="300" step="0.5" value={params.apr}
               onChange={e => setParams(p => ({ ...p, apr: parseFloat(e.target.value) }))}
               className="w-full h-px appearance-none cursor-pointer"
               style={{ accentColor: '#4f9cf9', background: 'rgba(255,255,255,0.08)' }} />
        <div className="flex justify-between text-[9px] text-white/15 mt-1.5">
          <span>0%</span><span>300%</span>
        </div>
      </div>

      {/* Age group */}
      <div>
        <label className="block text-[10px] text-white/35 mb-2.5 tracking-wide">Target Age Group</label>
        <div className="grid grid-cols-4 gap-1.5">
          {AGE_GROUPS.map(ag => (
            <button key={ag} onClick={() => setParams(p => ({ ...p, ageGroup: ag }))}
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

      {/* Vulnerable ratio */}
      <div>
        <div className="flex justify-between items-baseline mb-2.5">
          <label className="text-[10px] text-white/35 tracking-wide">Vulnerable Population</label>
          <span className="text-base font-light text-[#fb923c]">
            {Math.round(params.vulnerableRatio * 100)}%
          </span>
        </div>
        <input type="range" min="0" max="1" step="0.01" value={params.vulnerableRatio}
               onChange={e => setParams(p => ({ ...p, vulnerableRatio: parseFloat(e.target.value) }))}
               className="w-full h-px appearance-none cursor-pointer"
               style={{ accentColor: '#fb923c', background: 'rgba(255,255,255,0.08)' }} />
        <div className="flex justify-between text-[9px] text-white/15 mt-1.5">
          <span>0%</span><span>100%</span>
        </div>
      </div>

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
