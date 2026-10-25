import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { getCameras, getRecordings } from '../api/client'
import type { Camera, Recording } from '../types'

import CameraList from '../components/CameraList'
import CalendarPicker from '../components/CalendarPicker'
import RecordingList from '../components/RecordingList'
import VideoPlayer from '../components/VideoPlayer'

export default function ViewerPage() {
  const [cameras, setCameras] = useState<Camera[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date())
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [selectedRecordingId, setSelectedRecordingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getCameras()
      .then((data) => {
        setCameras(data)
        if (data.length > 0) setSelectedCameraId(data[0].id)
      })
      .catch(() => setError('Kameralar yüklenemedi. Backend bağlantısını kontrol edin.'))
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedCameraId) return

    const controller = new AbortController()
    getRecordings(selectedCameraId, format(selectedDate, 'yyyy-MM-dd'), controller.signal)
      .then(setRecordings)
      .catch((err: unknown) => {
        if ((err as Error).name !== 'AbortError') setError('Kayıtlar yüklenemedi.')
      })
    return () => controller.abort()
  }, [selectedCameraId, selectedDate])

  const selectedCamera = useMemo(
    () => cameras.find((camera) => camera.id === selectedCameraId) ?? null,
    [cameras, selectedCameraId],
  )
  const selectedRecording = recordings.find((recording) => recording.id === selectedRecordingId) ?? null
  const totalSize = recordings.reduce((sum, recording) => sum + recording.size, 0)
  const handleCameraSelect = (cameraId: string) => { setSelectedRecordingId(null); setSelectedCameraId(cameraId) }
  const handleDateSelect = (date: Date) => { setSelectedRecordingId(null); setSelectedDate(date) }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">◈</div>
          <div>
            <p className="eyebrow">PLAINNVR / SECURE ARCHIVE</p>
            <h1>Güvenlik Kayıt Merkezi</h1>
          </div>
        </div>
        <div className="system-status"><span className="status-dot" /> Salt okunur mod aktif</div>
      </header>

      {error && <div className="notice error-notice" role="alert">{error}<button onClick={() => setError(null)} aria-label="Bildirimi kapat">×</button></div>}

      <section className="dashboard-grid">
        <aside className="panel camera-panel">
          <CameraList cameras={cameras} selectedCameraId={selectedCameraId} onSelectCamera={handleCameraSelect} isLoading={isLoading} />
        </aside>

        <section className="panel archive-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">ARŞİV TAKVİMİ</p>
              <h2>Gün seçin</h2>
            </div>
            <span className="date-chip">{format(selectedDate, 'dd MMM yyyy')}</span>
          </div>
          <CalendarPicker cameraId={selectedCameraId} onSelectDate={handleDateSelect} />
          <div className="section-divider" />
          <RecordingList recordings={recordings} selectedRecordingId={selectedRecordingId} onSelectRecording={setSelectedRecordingId} totalSize={totalSize} />
        </section>

        <section className="panel player-panel">
          <VideoPlayer recordingId={selectedRecordingId} cameraName={selectedCamera?.name} recording={selectedRecording} />
        </section>
      </section>

      <footer className="app-footer"><span>PlainNVR Viewer</span><span>Veri kaynağına yazma erişimi kapalıdır</span></footer>
    </main>
  )
}
