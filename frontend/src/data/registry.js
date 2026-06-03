// ─── Compliance Registry (illustrative demo data) ────────────────────────────
// Products & firms that have been audited through the platform. Shown on the
// public home page as a trust signal — both regulators and firms can browse it.
// Names are fictional/illustrative for the hackathon demo.

export const REGISTRY = [
  { firm: 'Northwind Pay',   product: 'Flex — Pay in 3',        category: 'BNPL',       score: 88, status: 'PASS', date: '2026-05-28', rule: 'PRIN 2A.3' },
  { firm: 'Aegis Mutual',    product: 'HomeGuard Cover',         category: 'Insurance', score: 91, status: 'PASS', date: '2026-05-26', rule: 'ICOBS 6.1' },
  { firm: 'Lumen Invest',    product: 'Core Stocks ISA',         category: 'Investment',score: 84, status: 'PASS', date: '2026-05-24', rule: 'PRIN 2A.4' },
  { firm: 'Sterling Credit', product: 'Everyday Credit Card',    category: 'Credit',    score: 79, status: 'PASS', date: '2026-05-22', rule: 'PRIN 2A.2' },
  { firm: 'Harbour Finance', product: 'QuickCash Advance',       category: 'HCSTC',     score: 41, status: 'REVIEW',date: '2026-05-21', rule: 'PRIN 2A.3' },
  { firm: 'Meadow Life',     product: 'Over-50s Life Plan',      category: 'Insurance', score: 86, status: 'PASS', date: '2026-05-19', rule: 'PRIN 2A.4' },
  { firm: 'Cobalt Wealth',   product: 'Managed Growth Portfolio',category: 'Investment',score: 82, status: 'PASS', date: '2026-05-17', rule: 'PRIN 2A.3' },
  { firm: 'Toll Gate Loans', product: 'Bridging Loan 12m',       category: 'Credit',    score: 38, status: 'REVIEW',date: '2026-05-15', rule: 'PRIN 2A.2' },
]

export const REGISTRY_STATS = {
  products:  142,
  firms:     37,
  avgScore:  81,
  finesAvoided: '£12.4m',
}

export const CATEGORY_TINT = {
  BNPL:       '#4f9cf9',
  Insurance:  '#00b4a6',
  Investment: '#7c6cf0',
  Credit:     '#f0934f',
  HCSTC:      '#e0567a',
}
