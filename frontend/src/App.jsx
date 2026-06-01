import { useState } from 'react'
import UploadPage   from './pages/UploadPage'
import AnalysisPage from './pages/AnalysisPage'
import ReportPage   from './pages/ReportPage'

export default function App() {
  const [page,   setPage]   = useState('upload')  // upload | analysis | report
  const [file,   setFile]   = useState(null)
  const [result, setResult] = useState(null)
  const [error,  setError]  = useState('')

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
    setFile(null); setResult(null); setError(''); setPage('upload')
  }

  if (page === 'analysis') return (
    <AnalysisPage file={file} onComplete={handleComplete} onError={handleError} />
  )
  if (page === 'report') return (
    <ReportPage result={result} onReset={handleReset} />
  )
  return <UploadPage onUpload={handleUpload} errorMsg={error} />
}
