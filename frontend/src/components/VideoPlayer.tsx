import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { getVideoUrl } from '../api/client'
import type { Recording } from '../types'

interface VideoPlayerProps { recordingId: string | null; cameraName?: string; recording: Recording | null }

export default function VideoPlayer({ recordingId, cameraName, recording }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [speed, setSpeed] = useState(1)

  useEffect(() => {
    if (videoRef.current) { videoRef.current.pause(); videoRef.current.src = ''; videoRef.current.load() }
    if (recordingId && videoRef.current) { videoRef.current.src = getVideoUrl(recordingId); videoRef.current.load() }
  }, [recordingId])

  const toggleSpeed = () => { const next = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1; setSpeed(next); if (videoRef.current) videoRef.current.playbackRate = next }
  const toggleFullscreen = () => { if (videoRef.current?.requestFullscreen) videoRef.current.requestFullscreen() }
  const captureFrame = () => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const canvas = document.createElement('canvas'); canvas.width = video.videoWidth; canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    const link = document.createElement('a'); link.download = `plainnvr-${Date.now()}.png`; link.href = canvas.toDataURL('image/png'); link.click()
  }
  const timeLabel = recording ? `${format(new Date(recording.start), 'HH:mm:ss')}${recording.end ? ` — ${format(new Date(recording.end), 'HH:mm:ss')}` : ''}` : ''

  return <div className="video-player">
    <div className="player-header"><div><p className="eyebrow">GÖRÜNTÜLEYİCİ</p><h2>{cameraName ?? 'Kayıt oynatıcı'}</h2><span className="player-meta">{recording ? `${timeLabel} · Arşiv kaydı` : 'Bir kayıt seçilmedi'}</span></div><span className={`recording-pill ${recordingId ? 'ready' : ''}`}><i /> {recordingId ? 'HAZIR' : 'BEKLEMEDE'}</span></div>
    <div className={`video-stage ${!recordingId ? 'idle' : ''}`}>
      {recordingId ? <><video ref={videoRef} controls playsInline><track kind="captions" /></video><div className="stage-corner top-left" /><div className="stage-corner top-right" /><div className="stage-corner bottom-left" /><div className="stage-corner bottom-right" /></> : <div className="player-empty"><div className="large-camera-icon">▣</div><strong>İzlemeye hazır</strong><span>Sol menüden kamera, arşivden kayıt seçin.</span></div>}
    </div>
    <div className="player-toolbar"><span className="toolbar-label">KAYIT KONTROLLERİ</span><div className="toolbar-actions"><button onClick={toggleSpeed} disabled={!recordingId}>↗ {speed}x</button><button onClick={captureFrame} disabled={!recordingId}>▧ Kare al</button><button onClick={toggleFullscreen} disabled={!recordingId}>⛶ Tam ekran</button></div></div>
  </div>
}
