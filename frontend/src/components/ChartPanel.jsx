// ─── ChartPanel ───────────────────────────────────────────────────────────────
// Right-side 90-day dual-axis line chart.
// Props:
//   risks       – number[] of length visiblePts (risk scores 0-100)
//   complaints  – number[] of length visiblePts (cumulative complaint counts)
//   isRunning   – shows pulsing indicator when true
//   progress    – 0-100, drives the progress bar

import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 0 },
  interaction: { mode: 'index', intersect: false },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.04)' },
      ticks: { color: '#6b7280', maxTicksLimit: 10, font: { size: 11 } },
    },
    y: {
      type: 'linear', position: 'left',
      min: 0, max: 100,
      grid: { color: 'rgba(255,255,255,0.05)' },
      ticks: { color: '#ef4444', font: { size: 11 } },
      title: { display: true, text: 'Risk Score', color: '#ef4444', font: { size: 11 } },
    },
    y1: {
      type: 'linear', position: 'right',
      grid: { drawOnChartArea: false },
      ticks: { color: '#eab308', font: { size: 11 } },
      title: { display: true, text: 'Complaints', color: '#eab308', font: { size: 11 } },
    },
  },
  plugins: {
    legend: {
      labels: { color: '#d1d5db', usePointStyle: true, pointStyleWidth: 14, padding: 20 },
    },
    tooltip: {
      backgroundColor: 'rgba(17,24,39,0.96)',
      titleColor: '#f3f4f6',
      bodyColor: '#9ca3af',
      borderColor: 'rgba(75,85,99,0.5)',
      borderWidth: 1,
      padding: 10,
      callbacks: {
        label: ctx =>
          ctx.datasetIndex === 0
            ? `  Risk: ${ctx.parsed.y.toFixed(1)}`
            : `  Complaints: ${Math.round(ctx.parsed.y)}`,
      },
    },
  },
}

export default function ChartPanel({ risks, complaints, isRunning, progress }) {
  const labels = risks.map((_, i) => `Day ${i + 1}`)

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Compliance Risk Score',
        data: risks,
        borderColor: 'rgb(239,68,68)',
        backgroundColor: 'rgba(239,68,68,0.12)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        yAxisID: 'y',
        pointRadius: 0, pointHoverRadius: 5,
      },
      {
        label: 'Cumulative Complaints',
        data: complaints,
        borderColor: 'rgb(234,179,8)',
        backgroundColor: 'rgba(234,179,8,0.06)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        yAxisID: 'y1',
        borderDash: [5, 4],
        pointRadius: 0, pointHoverRadius: 5,
      },
    ],
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">
          90-Day Risk Analysis
        </h2>
        {isRunning && (
          <div className="flex items-center gap-2 text-xs text-blue-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse inline-block" />
            Simulating 1,000 agents…
          </div>
        )}
      </div>

      <div className="flex-1 min-h-[280px]">
        {risks.length > 0 ? (
          <Line data={chartData} options={CHART_OPTIONS} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-700">
            <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm">Set parameters and run the simulation</p>
          </div>
        )}
      </div>

      {isRunning && (
        <div className="mt-4 h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}
