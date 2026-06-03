import { useState } from 'react'
import HomePage     from './pages/HomePage'
import UploadPage   from './pages/UploadPage'
import AnalysisPage from './pages/AnalysisPage'
import ReportPage   from './pages/ReportPage'

export default function App() {
  const [page,   setPage]   = useState('home')  // home | upload | analysis | report
  const [file,   setFile]   = useState(null)
  const [result, setResult] = useState(null)
  const [error,  setError]  = useState('')

  const handleStart = () => {
    setError(''); setPage('upload')
  }

  const handleUpload = f => {
    setFile(f); setError(''); setResult(null); setPage('analysis')
  }

  const handleComplete = r => {
    setResult(r); setPage('report')
  }

  const handleError = msg => {
    setError(msg); setPage('upload')
  }

  const handleReset = () => {
    setFile(null); setResult(null); setError(''); setPage('home')
  }

  if (page === 'upload') return (
    <UploadPage onUpload={handleUpload} errorMsg={error} onBack={() => setPage('home')} />
  )
  if (page === 'analysis') return (
    <AnalysisPage file={file} onComplete={handleComplete} onError={handleError} />
  )
  if (page === 'report') return (
    <ReportPage result={result} onReset={handleReset} />
  )
  return <HomePage onStart={handleStart} />
}
