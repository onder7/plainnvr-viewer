import { useMemo, useState } from 'react'
import type { Camera } from '../types'

interface CameraListProps {
  cameras: Camera[]
  selectedCameraId: string | null
  onSelectCamera: (cameraId: string) => void
  isLoading?: boolean
}

const formatScheduleTooltip = (camera: Camera): string => {
  if (!camera.schedule) return 'Kayıt zamanlaması: Bilgi yok'
  
  if (camera.schedule.mode === 'always') {
    return 'Kayıt zamanlaması: 7/24 Sürekli Kayıt'
  }
  
  if (camera.schedule.mode === 'weekly' && camera.schedule.days) {
    const dayNames: { [key: string]: string } = {
      mon: 'Pzt', tue: 'Sal', wed: 'Çar', thu: 'Per', fri: 'Cum', sat: 'Cmt', sun: 'Paz'
    }
    
    const activeDays = Object.keys(camera.schedule.days).filter(
      day => camera.schedule!.days![day].length > 0
    )
    
    if (activeDays.length === 7) {
      const firstDay = activeDays[0]
      const times = camera.schedule.days[firstDay]
      if (times.length > 0) {
        return `Kayıt zamanlaması: Her gün ${times[0].start} - ${times[0].end}`
      }
    }
    
    const dayList = activeDays.map(d => dayNames[d] || d).join(', ')
    const firstDay = activeDays[0]
    const times = camera.schedule.days[firstDay]
    if (times.length > 0) {
      return `Kayıt zamanlaması: ${dayList} | ${times[0].start}-${times[0].end}`
    }
    return `Kayıt zamanlaması: ${dayList}`
  }
  
  return 'Kayıt zamanlaması: Haftalık Program'
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
              <button 
                className={`camera-item ${selectedCameraId === camera.id ? 'selected' : ''}`} 
                onClick={() => onSelectCamera(camera.id)}
                title={formatScheduleTooltip(camera)}
              >
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
