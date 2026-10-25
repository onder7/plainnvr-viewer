import { useEffect, useState, useRef } from 'react'
import { getCameras } from '../api/client'
import type { Camera } from '../types'
import Hls from 'hls.js'
import Header from '../components/Header'
import CameraInfo from '../components/CameraInfo'

export default function LiveViewPage() {
  const [cameras, setCameras] = useState<Camera[]>([])
  const [selectedCameraSlug, setSelectedCameraSlug] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [streamError, setStreamError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)

  useEffect(() => {
    getCameras()
      .then((data) => {
        setCameras(data)
        if (data.length > 0) setSelectedCameraSlug(data[0].slug)
      })
      .catch(() => setError('Kameralar yüklenemedi'))
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedCameraSlug || !videoRef.current) return

    const video = videoRef.current
    const streamUrl = `/api/live/${selectedCameraSlug}/stream.m3u8`
    setStreamError(null)

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 10,
      })
      
      hlsRef.current = hls
      hls.loadSource(streamUrl)
      hls.attachMedia(video)
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch((e) => console.warn('Autoplay blocked:', e))
      })

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setStreamError('Ağ hatası - yeniden bağlanılıyor...')
              hls.startLoad()
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              setStreamError('Medya hatası - kurtarma deneniyor...')
              hls.recoverMediaError()
              break
            default:
              setStreamError('Kritik hata - stream yüklenemedi')
              hls.destroy()
              break
          }
        }
      })

      return () => {
        hls.destroy()
        hlsRef.current = null
      }
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS support
      video.src = streamUrl
      video.addEventListener('loadedmetadata', () => {
        video.play().catch((e) => console.warn('Autoplay blocked:', e))
      })
    } else {
      setStreamError('HLS desteklenmiyor - tarayıcınızı güncelleyin')
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.src = ''
      }
    }
  }, [selectedCameraSlug])

  const selectedCamera = cameras.find((c) => c.slug === selectedCameraSlug) ?? null

  return (
    <main className="app-shell">
      <Header />

      {error && (
        <div className="notice error-notice" role="alert">
          {error}
          <button onClick={() => setError(null)} aria-label="Bildirimi kapat">×</button>
        </div>
      )}

      <section className="dashboard-grid live-view-grid">
        <aside className="panel camera-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">KAMERALAR</p>
              <h2>Canlı Görüntü</h2>
            </div>
            <span className="count-badge">{cameras.length}</span>
          </div>

          {isLoading ? (
            <div className="empty-state small">
              <span>Yükleniyor...</span>
            </div>
          ) : (
            <ul className="camera-items">
              {cameras.map((camera) => (
                <li key={camera.id}>
                  <button
                    className={`camera-item ${camera.slug === selectedCameraSlug ? 'selected' : ''}`}
                    onClick={() => setSelectedCameraSlug(camera.slug)}
                  >
                    <div className="camera-icon">📹</div>
                    <div className="camera-copy">
                      <strong>{camera.name}</strong>
                      <small>{camera.slug}</small>
                    </div>
                    <div className="camera-state">
                      <i aria-label="Aktif" />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {selectedCamera && <CameraInfo camera={selectedCamera} />}
        </aside>

        <section className="panel player-panel live-player">
          <div className="player-header">
            <div>
              <p className="eyebrow">CANLI GÖRÜNTÜ</p>
              <h2>{selectedCamera?.name ?? 'Kamera seçiniz'}</h2>
              {selectedCamera && (
                <span className="player-meta">{selectedCamera.slug}</span>
              )}
            </div>
            <div className="recording-pill ready">
              <i />
              <span>CANLI</span>
            </div>
          </div>

          <div className="video-stage">
            {selectedCameraSlug ? (
              <>
                <video
                  ref={videoRef}
                  controls
                  muted
                  playsInline
                  className="live-video"
                />
                {streamError && (
                  <div className="stream-error">
                    <span>⚠️ {streamError}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="player-empty">
                <div className="large-camera-icon">📹</div>
                <strong>Canlı görüntü için kamera seçin</strong>
                <span>Sol taraftaki listeden bir kamera seçerek canlı görüntüyü izleyebilirsiniz</span>
              </div>
            )}
            <span className="stage-corner top-left" />
            <span className="stage-corner top-right" />
            <span className="stage-corner bottom-left" />
            <span className="stage-corner bottom-right" />
          </div>

          <div className="player-toolbar">
            <span className="toolbar-label">CANLI YAYIN</span>
            <div className="toolbar-actions">
              <button disabled={!selectedCameraSlug} onClick={() => videoRef.current?.play()}>
                ▶ Oynat
              </button>
              <button disabled={!selectedCameraSlug} onClick={() => videoRef.current?.pause()}>
                ⏸ Duraklat
              </button>
              <button
                disabled={!selectedCameraSlug}
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.muted = !videoRef.current.muted
                  }
                }}
              >
                🔊 Ses
              </button>
            </div>
          </div>
        </section>
      </section>

      <footer className="app-footer">
        <span>PlainNVR Viewer - Canlı Görüntü</span>
        <span>HLS stream via go2rtc</span>
      </footer>
    </main>
  )
}
