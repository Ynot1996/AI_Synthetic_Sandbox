import { useCallback, useState } from 'react'

export default function UploadPage({ onUpload, errorMsg, onBack }) {
  const [dragging, setDragging] = useState(false)
  const [file, setFile]         = useState(null)
  const [error, setError]       = useState(errorMsg || '')

  const accept = f => f.name.match(/\.(pdf|txt)$/i)

  const pick = useCallback(f => {
    if (!f) return
    if (!accept(f)) { setError('Only PDF or TXT files are supported.'); return }
    setError('')
    setFile(f)
  }, [])

  const onDrop = useCallback(e => {
    e.preventDefault(); setDragging(false)
    pick(e.dataTransfer.files[0])
  }, [pick])

  const onInputChange = e => pick(e.target.files[0])
  const handleAnalyse = () => { if (file) onUpload(file) }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative"
         style={{ background: '#08090a' }}>

      {onBack && (
        <button onClick={onBack}
                className="absolute top-6 left-6 flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Home
        </button>
      )}

      {/* Header */}
      <div className="mb-12 text-center animate-fadeUp">
        <div className="inline-flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-[#4f9cf9] animate-pulse-dot" />
          <span className="text-[10px] tracking-[0.35em] text-white/25 uppercase">
            Universal RegTech OS
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extralight tracking-tight text-white">
          Compliance <span className="text-[#4f9cf9] font-light">Audit</span>
        </h1>
        <p className="mt-3 text-sm text-white/25 tracking-widest uppercase">
          FCA Consumer Duty · PS22/9 · FG22/5
        </p>
      </div>

      {/* Drop zone */}
      <div
        className={`animate-fadeUp delay-100 w-full max-w-md glass rounded-2xl p-10 flex flex-col items-center gap-6 cursor-pointer transition-all duration-300
          ${dragging ? 'border-[#4f9cf9]/60 bg-white/[0.07]' : 'hover:border-white/15'}
          ${file ? 'border-[#00d4aa]/40' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => document.getElementById('file-input').click()}
      >
        <input id="file-input" type="file" accept=".pdf,.txt"
               className="hidden" onChange={onInputChange} />

        <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all
          ${file ? 'bg-[#00d4aa]/10' : 'bg-white/[0.04]'}`}>
          {file ? (
            <svg className="w-7 h-7 text-[#00d4aa]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-7 h-7 text-white/20" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          )}
        </div>

        {file ? (
          <div className="text-center">
            <p className="text-[#00d4aa] text-sm font-medium">{file.name}</p>
            <p className="text-white/25 text-xs mt-1">{(file.size / 1024).toFixed(1)} KB · Ready</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-white/50 text-sm font-light">Drop file here or click to browse</p>
            <p className="text-white/20 text-xs mt-1.5 tracking-wide">PDF · TXT · Max 10 MB</p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-400/80 animate-fadeIn">{error}</p>
      )}

      <button
        onClick={handleAnalyse}
        disabled={!file}
        className={`animate-fadeUp delay-200 mt-7 px-12 py-3.5 rounded-xl text-sm font-medium tracking-widest uppercase transition-all duration-300
          ${file
            ? 'bg-[#4f9cf9] text-white hover:bg-[#4f9cf9]/80 shadow-lg shadow-[#4f9cf9]/20'
            : 'bg-white/[0.04] text-white/15 cursor-not-allowed'}`}
      >
        Begin Audit
      </button>

      {/* Flow indicator */}
      <div className="animate-fadeUp delay-300 mt-16 flex items-center gap-1 text-[10px] tracking-[0.25em] text-white/12 select-none uppercase">
        <span className="text-[#4f9cf9]/40">Stage 1 · Static Audit</span>
        <span className="px-3 text-white/10">→</span>
        <span>Stage 2 · Simulation</span>
        <span className="px-3 text-white/10">→</span>
        <span>Report</span>
      </div>
    </div>
  )
}
