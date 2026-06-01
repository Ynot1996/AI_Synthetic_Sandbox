// ─── FormPanel ────────────────────────────────────────────────────────────────
// Left-side input panel.
// Props:
//   params       – current form values
//   setParams    – state setter from parent
//   onRun        – called when "Run Simulation" is clicked
//   isRunning    – disables the button during simulation
//   progress     – 0-100, shown on button while running
//   summary      – null | { peak_risk_score, peak_risk_day, total_complaints, compliance_verdict }

const PRODUCT_TYPES = [
  { value: 'buy-now-pay-later',  label: 'Buy Now, Pay Later (BNPL)' },
  { value: 'high-interest-loan', label: 'High-Interest Personal Loan' },
  { value: 'credit-card',        label: 'Credit Card' },
  { value: 'payday-loan',        label: 'Payday Loan' },
  { value: 'investment-product', label: 'Investment Product' },
]

const AGE_GROUPS = ['18–25', '26–40', '41–60', '60+']

const VERDICT_STYLE = {
  LOW_RISK:    { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/40', label: 'LOW RISK' },
  MEDIUM_RISK: { bg: 'bg-yellow-500/10',  text: 'text-yellow-400',  border: 'border-yellow-500/40',  label: 'MEDIUM RISK' },
  HIGH_RISK:   { bg: 'bg-orange-500/10',  text: 'text-orange-400',  border: 'border-orange-500/40',  label: 'HIGH RISK' },
  CRITICAL:    { bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/40',     label: 'CRITICAL' },
}

export default function FormPanel({ params, setParams, onRun, isRunning, progress, summary }) {
  const vs = summary ? (VERDICT_STYLE[summary.compliance_verdict] ?? VERDICT_STYLE.MEDIUM_RISK) : null

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-5">
      <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">
        Product Parameters
      </h2>

      {/* Product type */}
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Product Type</label>
        <select
          value={params.productType}
          onChange={e => setParams(p => ({ ...p, productType: e.target.value }))}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500 transition cursor-pointer"
        >
          {PRODUCT_TYPES.map(pt => (
            <option key={pt.value} value={pt.value}>{pt.label}</option>
          ))}
        </select>
      </div>

      {/* APR slider */}
      <div>
        <div className="flex justify-between items-baseline mb-2">
          <label className="text-xs text-gray-400">Annual Percentage Rate (APR)</label>
          <span className="text-base font-bold text-blue-400">{params.apr.toFixed(1)}%</span>
        </div>
        <input
          type="range" min="0" max="300" step="0.5"
          value={params.apr}
          onChange={e => setParams(p => ({ ...p, apr: parseFloat(e.target.value) }))}
          className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between text-[10px] text-gray-600 mt-1">
          <span>0%</span><span>300%</span>
        </div>
      </div>

      {/* Age group */}
      <div>
        <label className="block text-xs text-gray-400 mb-2">Target Age Group</label>
        <div className="grid grid-cols-4 gap-1.5">
          {AGE_GROUPS.map(ag => (
            <button
              key={ag}
              onClick={() => setParams(p => ({ ...p, ageGroup: ag }))}
              className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                params.ageGroup === ag
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              {ag}
            </button>
          ))}
        </div>
      </div>

      {/* Vulnerable population slider */}
      <div>
        <div className="flex justify-between items-baseline mb-2">
          <label className="text-xs text-gray-400">Vulnerable Population</label>
          <span className="text-base font-bold text-orange-400">
            {Math.round(params.vulnerableRatio * 100)}%
          </span>
        </div>
        <input
          type="range" min="0" max="1" step="0.01"
          value={params.vulnerableRatio}
          onChange={e => setParams(p => ({ ...p, vulnerableRatio: parseFloat(e.target.value) }))}
          className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-orange-500"
        />
        <div className="flex justify-between text-[10px] text-gray-600 mt-1">
          <span>0%</span><span>100%</span>
        </div>
      </div>

      {/* Run button */}
      <button
        onClick={onRun}
        disabled={isRunning}
        className={`mt-1 w-full py-3 rounded-xl font-semibold text-sm tracking-wide transition-all ${
          isRunning
            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-500 active:scale-95 text-white shadow-lg shadow-blue-600/30'
        }`}
      >
        {isRunning ? `Simulating… ${progress}%` : '▶  Run Simulation'}
      </button>

      {/* Result summary */}
      {summary && vs && (
        <div className={`border rounded-xl p-4 ${vs.bg} ${vs.border} animate-fadeSlideIn`}>
          <div className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${vs.text}`}>
            Compliance Verdict · {vs.label}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-[10px] text-gray-500 mb-0.5">Peak Risk</div>
              <div className={`text-xl font-bold ${vs.text}`}>{summary.peak_risk_score}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 mb-0.5">Peak Day</div>
              <div className="text-xl font-bold text-gray-100">#{summary.peak_risk_day}</div>
            </div>
            <div className="col-span-2">
              <div className="text-[10px] text-gray-500 mb-0.5">Total Complaints (90d)</div>
              <div className="text-xl font-bold text-gray-100">
                {summary.total_complaints.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
