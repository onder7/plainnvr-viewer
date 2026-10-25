import { format } from 'date-fns'
import type { Recording } from '../types'

interface RecordingListProps {
  recordings: Recording[]
  selectedRecordingId: string | null
  onSelectRecording: (recordingId: string) => void
  totalSize: number
}

export default function RecordingList({ recordings, selectedRecordingId, onSelectRecording, totalSize }: RecordingListProps) {
  const formatTime = (isoString: string) => {
    try { return format(new Date(isoString), 'HH:mm:ss') } catch { return isoString }
  }
  const formatSize = (bytes: number) => bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`

  return (
    <div className="recording-list">
      <div className="list-heading"><div><p className="eyebrow">SEÇİLİ GÜN</p><h2>Kayıtlar</h2></div><span className="recording-summary">{recordings.length} klip · {formatSize(totalSize)}</span></div>
      {recordings.length === 0 ? <div className="empty-state"><span className="empty-icon">◌</span><strong>Kayıt bulunamadı</strong><span>Bu tarih için arşivlenmiş bir video yok.</span></div> : (
        <ul className="recording-items">
          {recordings.map((recording) => (
            <li key={recording.id}>
              <button className={`recording-card ${selectedRecordingId === recording.id ? 'selected' : ''}`} onClick={() => onSelectRecording(recording.id)}>
                <span className="play-icon" aria-hidden="true">▶</span>
                <span className="recording-copy"><strong>{formatTime(recording.start)}{recording.end && ` — ${formatTime(recording.end)}`}</strong><small>Video segmenti · {formatSize(recording.size)}</small></span>
                <span className="card-arrow" aria-hidden="true">›</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
