import { useState } from 'react'
import Dashboard from '../components/Dashboard'

const SEV_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
const SEV_CLASS = { CRITICAL: 'badge-critical', HIGH: 'badge-high', MEDIUM: 'badge-medium', LOW: 'badge-low' }

const OUTCOMES = [
  { key: 'products_services',      label: 'Products & Services', rule: 'PRIN 2A.2' },
  { key: 'price_value',           label: 'Price & Value',       rule: 'PRIN 2A.3' },
  { key: 'consumer_understanding', label: 'Consumer Understanding', rule: 'PRIN 2A.4' },
  { key: 'consumer_support',      label: 'Consumer Support',    rule: 'PRIN 2A.5' },
]

function ScoreRing({ score }) {
  const r = 22, circ = 2 * Math.PI * r
  const color = score >= 70 ? '#00d4aa' : score >= 45 ? '#facc15' : '#f87171'
  return (
    <svg width={56} height={56} viewBox="0 0 56 56">
      <circle cx={28} cy={28} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={3.5} />
      <circle cx={28} cy={28} r={r} fill="none" stroke={color} strokeWidth={3.5}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)}
        strokeLinecap="round" transform="rotate(-90 28 28)"
        style={{ transition: 'stroke-dashoffset 1.2s ease' }} />
      <text x={28} y={33} textAnchor="middle" fill={color} fontSize={12} fontWeight="600">{score}</text>
    </svg>
  )
}

function OutcomeCard({ label, rule, score, delay }) {
  const color = score >= 70 ? '#00d4aa' : score >= 45 ? '#facc15' : '#f87171'
  const rag   = score >= 70 ? 'GREEN' : score >= 45 ? 'AMBER' : 'RED'
  return (
    <div className="glass rounded-xl p-4 flex flex-col gap-3 animate-fadeUp"
         style={{ animationDelay: `${delay}s` }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[9px] text-white/25 tracking-widest uppercase mb-1">{rule}</p>
          <p className="text-xs font-medium text-white/80 leading-tight">{label}</p>
        </div>
        <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold shrink-0"
              style={{ background: `${color}18`, color, border: `1px solid ${color}28` }}>
          {rag}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <ScoreRing score={score} />
        <div className="h-0.5 flex-1 bg-white/[0.05] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000"
               style={{ width: `${score}%`, background: color }} />
        </div>
      </div>
    </div>
  )
}

function ClauseCard({ clause, index }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="glass rounded-xl overflow-hidden animate-fadeUp"
         style={{ animationDelay: `${index * 0.04}s` }}>
      <button onClick={() => setOpen(o => !o)}
              className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/[0.025] transition-colors">
        <span className={`shrink-0 text-[9px] px-2 py-0.5 rounded-full font-bold mt-0.5 ${SEV_CLASS[clause.severity]}`}>
          {clause.severity}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white/70 leading-relaxed line-clamp-2">{clause.clause_text}</p>
          <p className="text-[10px] text-white/25 mt-1 font-mono">{clause.fca_rule}</p>
        </div>
        <svg className={`shrink-0 w-3.5 h-3.5 text-white/20 transition-transform mt-1 ${open ? 'rotate-180' : ''}`}
             fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-3 border-t border-white/[0.05] space-y-3">
          <div>
            <p className="text-[9px] text-white/20 uppercase tracking-widest mb-1.5">Issue</p>
            <p className="text-xs text-white/55 leading-relaxed">{clause.issue}</p>
          </div>
          <div>
            <p className="text-[9px] text-[#00d4aa]/50 uppercase tracking-widest mb-1.5">Suggested Revision</p>
            <p className="text-xs text-[#00d4aa]/75 leading-relaxed">{clause.suggested_revision}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ReportPage({ result, onReset }) {
  const [stage, setStage] = useState('report')
  const passed  = result.pass
  const clauses = [...(result.flagged_clauses || [])].sort(
    (a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]
  )
  const scores = result.consumer_duty_scores || {}
  const counts = clauses.reduce((a, c) => ({ ...a, [c.severity]: (a[c.severity] || 0) + 1 }), {})

  if (stage === 'simulate') return (
    <div style={{ background: '#08090a', minHeight: '100vh' }}>
      <div className="sticky top-0 z-20 flex items-center gap-3 px-5 py-3 glass border-b border-white/[0.06]">
        <button onClick={() => setStage('report')}
                className="flex items-center gap-1.5 text-xs text-white/25 hover:text-white/50 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Report
        </button>
        <span className="text-white/10">·</span>
        <span className="text-[9px] tracking-[0.3em] text-white/20 uppercase">Stage 2 — Dynamic Simulation</span>
      </div>
      <Dashboard presetParams={result.extracted_params} />
    </div>
  )

  return (
    <div className="min-h-screen px-5 py-10 md:px-10" style={{ background: '#08090a' }}>
      <div className="max-w-3xl mx-auto">

        {/* Nav */}
        <div className="flex items-center justify-between mb-10 animate-fadeUp">
          <button onClick={onReset}
                  className="flex items-center gap-1.5 text-xs text-white/20 hover:text-white/45 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            New Audit
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={async () => {
                try {
                  const res = await fetch('/api/report', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(result),
                  })
                  // Guard against saving an error body as a .pdf (unviewable file)
                  if (!res.ok) {
                    const err = await res.json().catch(() => ({ detail: res.statusText }))
                    throw new Error(err.detail || `Server returned ${res.status}`)
                  }
                  const blob = await res.blob()
                  if (blob.type !== 'application/pdf') {
                    throw new Error('Server did not return a PDF.')
                  }
                  const url  = URL.createObjectURL(blob)
                  const a    = document.createElement('a')
                  a.href = url
                  a.download = `regtech-audit-${result.audit_id}.pdf`
                  a.click()
                  URL.revokeObjectURL(url)
                } catch (e) { alert('PDF export failed: ' + e.message) }
              }}
              className="flex items-center gap-1.5 text-xs text-white/25 hover:text-white/50 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download PDF
            </button>
            <span className="text-[9px] tracking-[0.35em] text-white/15 uppercase">Universal RegTech OS</span>
          </div>
        </div>

        {/* Verdict */}
        <div className={`glass rounded-2xl p-6 mb-6 animate-fadeUp delay-100 ${passed ? 'border-[#00d4aa]/25' : 'border-red-500/15'}`}>
          <div className="flex items-start gap-5">
            <div className={`w-11 h-11 rounded-xl shrink-0 flex items-center justify-center text-lg
              ${passed ? 'bg-[#00d4aa]/10 text-[#00d4aa]' : 'bg-red-500/10 text-red-400'}`}>
              {passed ? '✓' : '✗'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] tracking-[0.3em] text-white/25 uppercase mb-1">
                {result.product_type?.replace(/_/g,' ').toUpperCase()} · ID {result.audit_id}
              </p>
              <p className={`text-2xl font-extralight tracking-tight ${passed ? 'text-[#00d4aa]' : 'text-red-400'}`}>
                Consumer Duty {passed ? 'PASS' : 'FAIL'}
              </p>
              <p className="text-xs text-white/35 mt-2 leading-relaxed">{result.summary}</p>
            </div>
            <span className={`shrink-0 text-[9px] px-2.5 py-1 rounded-full font-bold ${SEV_CLASS[result.overall_risk]}`}>
              {result.overall_risk}
            </span>
          </div>
          <div className="flex gap-2.5 mt-5 flex-wrap">
            {['CRITICAL','HIGH','MEDIUM','LOW'].filter(s => counts[s]).map(s => (
              <span key={s} className={`text-[10px] px-2.5 py-0.5 rounded-full ${SEV_CLASS[s]}`}>
                {counts[s]} {s}
              </span>
            ))}
          </div>
        </div>

        {/* Scorecard */}
        <div className="mb-6">
          <p className="text-[9px] tracking-[0.3em] text-white/20 uppercase mb-3 animate-fadeUp delay-200">
            Consumer Duty Scorecard
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {OUTCOMES.map(({ key, label, rule }, i) => (
              <OutcomeCard key={key} label={label} rule={rule}
                           score={scores[key] ?? 50} delay={0.22 + i * 0.06} />
            ))}
          </div>
        </div>

        {/* Flagged clauses */}
        {clauses.length > 0 && (
          <div className="mb-6">
            <p className="text-[9px] tracking-[0.3em] text-white/20 uppercase mb-3 animate-fadeUp">
              Flagged Clauses — {clauses.length} findings
            </p>
            <div className="space-y-2">
              {clauses.map((c, i) => <ClauseCard key={i} clause={c} index={i} />)}
            </div>
          </div>
        )}

        {/* Stage 2 CTA */}
        <div className="glass rounded-2xl p-6 animate-fadeUp delay-300">
          <div className="flex items-center justify-between flex-wrap gap-5">
            <div>
              <p className="text-sm font-light text-white">Stage 2 — Dynamic Simulation</p>
              <p className="text-xs text-white/30 mt-1">
                1,000 virtual agents · 90-day behaviour model · FCA stress-test
              </p>
              <div className="flex gap-4 mt-2.5 flex-wrap">
                {result.extracted_params?.apr && (
                  <span className="text-[10px] text-white/30">APR {result.extracted_params.apr}%</span>
                )}
                {result.extracted_params?.target_age_group && (
                  <span className="text-[10px] text-white/30">Age {result.extracted_params.target_age_group}</span>
                )}
                {result.extracted_params?.vulnerable_population_ratio && (
                  <span className="text-[10px] text-white/30">
                    Vulnerable {Math.round(result.extracted_params.vulnerable_population_ratio * 100)}%
                  </span>
                )}
              </div>
            </div>
            <button onClick={() => setStage('simulate')}
                    className="px-7 py-2.5 rounded-xl text-sm font-medium bg-[#4f9cf9] text-white hover:bg-[#4f9cf9]/80 transition-all shadow-lg shadow-[#4f9cf9]/15 tracking-wide">
              Run Simulation →
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
