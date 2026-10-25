import { useEffect, useState } from 'react'
import { getDiskUsage } from '../api/client'
import type { DiskUsage } from '../types'

interface HeaderProps {
  currentPage: 'recordings' | 'live'
  onPageChange: (page: 'recordings' | 'live') => void
}

export default function Header({ currentPage, onPageChange }: HeaderProps) {
  const [diskUsage, setDiskUsage] = useState<DiskUsage | null>(null)

  useEffect(() => {
    getDiskUsage()
      .then(setDiskUsage)
      .catch(() => {}) // Sessizce başarısız ol
    
    // Her 30 saniyede bir güncelle
    const interval = setInterval(() => {
      getDiskUsage()
        .then(setDiskUsage)
        .catch(() => {}) // Sessizce başarısız ol
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  return (
    <header className="topbar">
      <div className="brand-lockup">
        <div className="brand-mark" aria-hidden="true">◈</div>
        <div>
          <p className="eyebrow">PLAINNVR / SECURE ARCHIVE</p>
          <h1>Güvenlik Kayıt Merkezi</h1>
        </div>
      </div>

      <nav className="header-nav">
        <button
          className={currentPage === 'recordings' ? 'active' : ''}
          onClick={() => onPageChange('recordings')}
        >
          📼 Kayıtlar
        </button>
        <button
          className={currentPage === 'live' ? 'active' : ''}
          onClick={() => onPageChange('live')}
        >
          📹 Canlı Görüntü
        </button>
      </nav>
      
      <div className="header-right">
        {diskUsage && (
          <div className="disk-usage">
            <div className="disk-label">Disk Kullanımı</div>
            <div className="disk-bar">
              <div 
                className="disk-fill" 
                style={{ width: `${diskUsage.percent}%` }}
                aria-label={`${diskUsage.percent}% kullanımda`}
              />
            </div>
            <div className="disk-stats">
              <span>{formatBytes(diskUsage.used)} / {formatBytes(diskUsage.total)}</span>
              <span className="disk-percent">{diskUsage.percent.toFixed(1)}%</span>
            </div>
          </div>
        )}
        
        <div className="system-status">
          <span className="status-dot" /> Salt okunur mod aktif
        </div>
        
        <div className="developer-credit">
          <span className="credit-label">Geliştirici</span>
          <a href="mailto:onder7@gmail.com" className="credit-name">Önder Aköz</a>
        </div>
      </div>
    </header>
  )
}
