import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 0 },
  interaction: { mode: 'index', intersect: false },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.03)' },
      ticks: { color: 'rgba(255,255,255,0.2)', maxTicksLimit: 10, font: { size: 10 } },
      border: { color: 'rgba(255,255,255,0.05)' },
    },
    y: {
      type: 'linear', position: 'left', min: 0, max: 100,
      grid: { color: 'rgba(255,255,255,0.04)' },
      ticks: { color: '#f87171', font: { size: 10 } },
      border: { color: 'rgba(255,255,255,0.05)' },
      title: { display: true, text: 'Risk Score', color: '#f87171', font: { size: 10 } },
    },
    y1: {
      type: 'linear', position: 'right',
      grid: { drawOnChartArea: false },
      ticks: { color: '#facc15', font: { size: 10 } },
      border: { color: 'rgba(255,255,255,0.05)' },
      title: { display: true, text: 'Complaints', color: '#facc15', font: { size: 10 } },
    },
  },
  plugins: {
    legend: {
      labels: { color: 'rgba(255,255,255,0.4)', usePointStyle: true, pointStyleWidth: 10, padding: 20, font: { size: 10 } },
    },
    tooltip: {
      backgroundColor: 'rgba(8,9,10,0.95)',
      titleColor: 'rgba(255,255,255,0.7)',
      bodyColor: 'rgba(255,255,255,0.4)',
      borderColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      padding: 10,
      callbacks: {
        label: ctx => ctx.datasetIndex === 0
          ? `  Risk: ${ctx.parsed.y.toFixed(1)}`
          : `  Complaints: ${Math.round(ctx.parsed.y)}`,
      },
    },
  },
}

export default function ChartPanel({ risks, complaints, isRunning, progress }) {
  const labels = risks.map((_, i) => `Day ${i + 1}`)
  const data = {
    labels,
    datasets: [
      {
        label: 'Compliance Risk Score',
        data: risks,
        borderColor: '#f87171',
        backgroundColor: 'rgba(248,113,113,0.08)',
        borderWidth: 2, fill: true, tension: 0.4, yAxisID: 'y',
        pointRadius: 0, pointHoverRadius: 4,
      },
      {
        label: 'Cumulative Complaints',
        data: complaints,
        borderColor: '#facc15',
        backgroundColor: 'rgba(250,204,21,0.04)',
        borderWidth: 1.5, fill: false, tension: 0.4, yAxisID: 'y1',
        borderDash: [5, 4], pointRadius: 0, pointHoverRadius: 4,
      },
    ],
  }

  return (
    <div className="glass rounded-2xl p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-white/25">
          90-Day Risk Analysis
        </p>
        {isRunning && (
          <div className="flex items-center gap-2 text-[10px] text-[#4f9cf9]/70">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4f9cf9] animate-pulse-dot" />
            Simulating 1,000 agents…
          </div>
        )}
      </div>

      {/* Fixed-height, positioned wrapper — REQUIRED for Chart.js responsive mode.
          A flex-grow container that resizes with the canvas causes an infinite
          resize→render loop that hard-freezes the main thread. */}
      <div className="relative w-full" style={{ height: 300 }}>
        {risks.length > 0 ? (
          <Line data={data} options={OPTIONS} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-white/10">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.7}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-xs font-light tracking-wide">Configure parameters and run simulation</p>
          </div>
        )}
      </div>

      {isRunning && (
        <div className="mt-4 h-px bg-white/[0.05] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-75"
               style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #4f9cf9, #00d4aa)' }} />
        </div>
      )}
    </div>
  )
}
