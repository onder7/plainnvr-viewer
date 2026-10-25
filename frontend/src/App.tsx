import { useEffect, useState } from 'react'
import ViewerPage from './pages/ViewerPage'
import LoginPage from './pages/LoginPage'
import { getStoredToken } from './api/client'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getStoredToken()))

  useEffect(() => {
    const handleExpired = () => setIsAuthenticated(false)
    window.addEventListener('plainnvr-auth-expired', handleExpired)
    return () => window.removeEventListener('plainnvr-auth-expired', handleExpired)
  }, [])

  return isAuthenticated ? <ViewerPage /> : <LoginPage onLogin={() => setIsAuthenticated(true)} />
}

export default App
