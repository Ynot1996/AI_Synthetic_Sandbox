import { REGISTRY, REGISTRY_STATS, CATEGORY_TINT } from '../data/registry'

const INK    = '#1b1c22'
const SUB    = '#6b6d78'
const HAIR   = '#e9e9e3'
const PAPER  = '#f6f6f2'
const ACCENT = '#4f5bd5'

function StatusPill({ status }) {
  const pass = status === 'PASS'
  const c = pass ? '#0f9d72' : '#c98a00'
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-wide"
          style={{ background: `${c}14`, color: c, border: `1px solid ${c}26` }}>
      {pass ? 'APPROVED' : 'IN REVIEW'}
    </span>
  )
}

function ScoreRing({ score }) {
  const r = 18, circ = 2 * Math.PI * r
  const c = score >= 70 ? '#0f9d72' : score >= 45 ? '#c98a00' : '#d2553f'
  return (
    <svg width={46} height={46} viewBox="0 0 46 46" className="shrink-0">
      <circle cx={23} cy={23} r={r} fill="none" stroke="#ececdf" strokeWidth={3} />
      <circle cx={23} cy={23} r={r} fill="none" stroke={c} strokeWidth={3}
              strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)}
              strokeLinecap="round" transform="rotate(-90 23 23)" />
      <text x={23} y={27} textAnchor="middle" fontSize={12} fontWeight="600" fill={INK}>{score}</text>
    </svg>
  )
}

function RegistryCard({ item, i }) {
  const tint = CATEGORY_TINT[item.category] ?? ACCENT
  return (
    <div className="rounded-2xl p-5 bg-white animate-fadeUp transition-shadow hover:shadow-[0_8px_30px_rgba(20,20,30,0.06)]"
         style={{ border: `1px solid ${HAIR}`, animationDelay: `${i * 0.05}s` }}>
      <div className="flex items-start justify-between mb-4">
        <div className="min-w-0">
          <span className="text-[10px] font-semibold tracking-[0.18em] uppercase px-2 py-0.5 rounded-md"
                style={{ background: `${tint}14`, color: tint }}>
            {item.category}
          </span>
          <p className="mt-2.5 text-[15px] font-medium truncate" style={{ color: INK }}>{item.product}</p>
          <p className="text-xs mt-0.5" style={{ color: SUB }}>{item.firm}</p>
        </div>
        <ScoreRing score={item.score} />
      </div>
      <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${HAIR}` }}>
        <StatusPill status={item.status} />
        <span className="text-[10px] font-mono" style={{ color: '#aeb0a4' }}>{item.rule} · {item.date}</span>
      </div>
    </div>
  )
}

export default function HomePage({ onStart }) {
  return (
    <div className="min-h-screen" style={{ background: PAPER, color: INK }}>

      {/* Nav */}
      <header className="sticky top-0 z-20 backdrop-blur"
              style={{ background: 'rgba(246,246,242,0.8)', borderBottom: `1px solid ${HAIR}` }}>
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full" style={{ background: ACCENT }} />
            <span className="text-sm font-medium tracking-tight">Universal RegTech OS</span>
            <span className="hidden sm:inline text-[10px] tracking-[0.2em] uppercase ml-2" style={{ color: SUB }}>
              FCA Consumer Duty
            </span>
          </div>
          <button onClick={onStart}
                  className="text-xs font-medium px-4 py-2 rounded-full text-white transition-transform hover:-translate-y-px"
                  style={{ background: INK }}>
            Audit a product →
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-14 text-center">
        <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full animate-fadeUp"
             style={{ border: `1px solid ${HAIR}`, background: '#fff' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#0f9d72' }} />
          <span className="text-[11px] tracking-wide" style={{ color: SUB }}>
            {REGISTRY_STATS.products} products audited · {REGISTRY_STATS.firms} firms
          </span>
        </div>
        <h1 className="text-4xl md:text-6xl font-light tracking-tight leading-[1.08] animate-fadeUp delay-100">
          Prove your product is<br />
          <span style={{ color: ACCENT }}>fair by design.</span>
        </h1>
        <p className="mt-6 max-w-xl mx-auto text-[15px] leading-relaxed animate-fadeUp delay-200" style={{ color: SUB }}>
          A dual-engine compliance platform for FCA Consumer Duty. Upload a product document,
          get a static audit and a 90-day behavioural simulation — minutes, not weeks.
        </p>
        <div className="mt-9 flex items-center justify-center gap-3 animate-fadeUp delay-300">
          <button onClick={onStart}
                  className="px-7 py-3 rounded-full text-sm font-medium text-white transition-transform hover:-translate-y-px"
                  style={{ background: ACCENT, boxShadow: '0 8px 24px rgba(79,91,213,0.25)' }}>
            Start an audit
          </button>
          <a href="#registry"
             className="px-7 py-3 rounded-full text-sm font-medium transition-colors hover:bg-white"
             style={{ border: `1px solid ${HAIR}`, color: INK }}>
            Browse the registry
          </a>
        </div>
      </section>

      {/* Stats strip */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 rounded-2xl overflow-hidden bg-white animate-fadeUp"
             style={{ border: `1px solid ${HAIR}` }}>
          {[
            ['Products audited', REGISTRY_STATS.products],
            ['Firms onboarded',  REGISTRY_STATS.firms],
            ['Avg duty score',   REGISTRY_STATS.avgScore],
            ['Est. fines avoided', REGISTRY_STATS.finesAvoided],
          ].map(([label, val], i) => (
            <div key={label} className="p-6 text-center"
                 style={{ borderLeft: i ? `1px solid ${HAIR}` : 'none' }}>
              <p className="text-3xl font-light tracking-tight" style={{ color: INK }}>{val}</p>
              <p className="mt-1 text-[11px] tracking-wide uppercase" style={{ color: SUB }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Registry */}
      <section id="registry" className="max-w-5xl mx-auto px-6 pb-16 scroll-mt-20">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-[11px] tracking-[0.25em] uppercase mb-1" style={{ color: ACCENT }}>Compliance Registry</p>
            <h2 className="text-2xl font-light tracking-tight">Recently assessed products</h2>
          </div>
          <span className="text-xs hidden sm:block" style={{ color: SUB }}>Updated daily · illustrative data</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {REGISTRY.map((item, i) => <RegistryCard key={item.firm + item.product} item={item} i={i} />)}
        </div>
      </section>

      {/* Dual audience */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { tag: 'For Firms', title: 'Ship with confidence', body: 'Catch Consumer Duty gaps before launch. Cut legal review from weeks to minutes and protect your reputation pre-fine.', cta: 'Audit your product', action: onStart },
            { tag: 'For Regulators', title: 'Supervise proactively', body: 'A crawling tool that auto-simulates consumer behaviour to surface non-compliant products — with explainable, citation-backed evidence.', cta: 'See a live audit', action: onStart },
          ].map(c => (
            <div key={c.tag} className="rounded-2xl p-7 bg-white animate-fadeUp" style={{ border: `1px solid ${HAIR}` }}>
              <p className="text-[11px] tracking-[0.2em] uppercase mb-3" style={{ color: ACCENT }}>{c.tag}</p>
              <h3 className="text-xl font-medium mb-2 tracking-tight">{c.title}</h3>
              <p className="text-sm leading-relaxed mb-5" style={{ color: SUB }}>{c.body}</p>
              <button onClick={c.action} className="text-sm font-medium" style={{ color: ACCENT }}>{c.cta} →</button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: HAIR }}>
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs" style={{ color: SUB }}>Universal RegTech OS · FCA PS22/9 · FG22/5 · FG21/1</span>
          <span className="text-[11px] tracking-wide" style={{ color: '#aeb0a4' }}>Built for UK FinNovator · demo</span>
        </div>
      </footer>
    </div>
  )
}
