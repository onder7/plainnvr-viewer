import { useState } from 'react'
import type { FormEvent } from 'react'
import { login, saveToken } from '../api/client'

interface LoginPageProps { onLogin: () => void }

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!password) { setError('Şifrenizi girin.'); return }
    setIsLoading(true); setError('')
    try { const result = await login(password); saveToken(result.access_token); onLogin() }
    catch { setError('Şifre hatalı veya sunucuya bağlanılamadı.') }
    finally { setIsLoading(false) }
  }

  return <main className="login-shell"><div className="login-card">
    <div className="brand-mark login-mark" aria-hidden="true">◈</div>
    <p className="eyebrow">PLAINNVR / SECURE ARCHIVE</p>
    <h1>Güvenlik Kayıt Merkezi</h1>
    <p className="login-description">Arşive erişmek için görüntüleyici şifrenizi girin.</p>
    <form onSubmit={handleSubmit}>
      <label className="login-label" htmlFor="viewer-password">Görüntüleyici şifresi</label>
      <input id="viewer-password" className="login-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Şifrenizi girin" autoFocus />
      {error && <p className="login-error" role="alert">{error}</p>}
      <button className="login-button" type="submit" disabled={isLoading}>{isLoading ? 'Kontrol ediliyor…' : 'Giriş yap'} <span aria-hidden="true">→</span></button>
    </form>
    <p className="login-footnote">Salt okunur arşiv erişimi · Yetkilendirilmiş kullanıcılar için</p>
  </div></main>
}
