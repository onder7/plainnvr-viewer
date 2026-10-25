import { useMemo, useState } from 'react'
import type { Camera } from '../types'

interface CameraListProps {
  cameras: Camera[]
  selectedCameraId: string | null
  onSelectCamera: (cameraId: string) => void
  isLoading?: boolean
}

export default function CameraList({ cameras, selectedCameraId, onSelectCamera, isLoading }: CameraListProps) {
  const [query, setQuery] = useState('')
  const filteredCameras = useMemo(
    () => cameras.filter((camera) => `${camera.name} ${camera.slug}`.toLowerCase().includes(query.toLowerCase())),
    [cameras, query],
  )

  return (
    <div className="camera-list">
      <div className="panel-heading camera-heading">
        <div><p className="eyebrow">KAYNAKLAR</p><h2>Kameralar</h2></div>
        <span className="count-badge">{cameras.length}</span>
      </div>
      <label className="search-field">
        <span aria-hidden="true">⌕</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Kamera ara..." aria-label="Kamera ara" />
        {query && <button type="button" onClick={() => setQuery('')} aria-label="Aramayı temizle">×</button>}
      </label>
      <div className="list-label"><span>ALGILANAN CİHAZLAR</span><span className="live-indicator"><i /> CANLI</span></div>
      {isLoading ? <div className="empty-state small">Kameralar aranıyor…</div> : filteredCameras.length === 0 ? <div className="empty-state small">Eşleşen kamera bulunamadı.</div> : (
        <ul className="camera-items">
          {filteredCameras.map((camera) => (
            <li key={camera.id}>
              <button className={`camera-item ${selectedCameraId === camera.id ? 'selected' : ''}`} onClick={() => onSelectCamera(camera.id)}>
                <span className="camera-icon" aria-hidden="true">▣</span>
                <span className="camera-copy"><strong>{camera.name}</strong><small>{camera.slug}</small></span>
                <span className="camera-state" aria-label={camera.enabled ? 'aktif' : 'pasif'}><i /></span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="panel-footnote"><span className="shield-icon">◇</span><span>Bağlantı güvenli<br /><b>Salt okunur erişim</b></span></div>
    </div>
  )
}
