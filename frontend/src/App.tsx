import { useEffect, useState } from 'react'
import ViewerPage from './pages/ViewerPage'
import LiveViewPage from './pages/LiveViewPage'
import LoginPage from './pages/LoginPage'
import { getStoredToken } from './api/client'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getStoredToken()))
  const [currentPage, setCurrentPage] = useState<'recordings' | 'live'>('recordings')

  useEffect(() => {
    const handleExpired = () => setIsAuthenticated(false)
    window.addEventListener('plainnvr-auth-expired', handleExpired)
    return () => window.removeEventListener('plainnvr-auth-expired', handleExpired)
  }, [])

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />
  }

  return (
    <>
      <nav className="app-nav">
        <button
          className={currentPage === 'recordings' ? 'active' : ''}
          onClick={() => setCurrentPage('recordings')}
        >
          📼 Kayıtlar
        </button>
        <button
          className={currentPage === 'live' ? 'active' : ''}
          onClick={() => setCurrentPage('live')}
        >
          📹 Canlı Görüntü
        </button>
      </nav>
      {currentPage === 'recordings' ? <ViewerPage /> : <LiveViewPage />}
    </>
  )
}

export default App
