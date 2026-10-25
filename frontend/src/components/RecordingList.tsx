/**
 * List of recordings for a selected camera and date
 */
import { format } from 'date-fns';
import type { Recording } from '../types';

interface RecordingListProps {
  recordings: Recording[];
  selectedRecordingId: string | null;
  onSelectRecording: (recordingId: string) => void;
}

export default function RecordingList({
  recordings,
  selectedRecordingId,
  onSelectRecording,
}: RecordingListProps) {
  const formatTime = (isoString: string) => {
    try {
      return format(new Date(isoString), 'HH:mm:ss');
    } catch {
      return isoString;
    }
  };

  return (
    <div className="recording-list">
      <h2>Kayıtlar</h2>
      {recordings.length === 0 ? (
        <p>Bu tarihte kayıt bulunamadı</p>
      ) : (
        <ul>
          {recordings.map((rec) => (
            <li
              key={rec.id}
              className={selectedRecordingId === rec.id ? 'selected' : ''}
              onClick={() => onSelectRecording(rec.id)}
              style={{
                cursor: 'pointer',
                padding: '8px',
                marginBottom: '4px',
                borderBottom: '1px solid #ddd',
              }}
            >
              <div>
                <strong>{formatTime(rec.start)}</strong>
                {rec.end && ` - ${formatTime(rec.end)}`}
              </div>
              <div style={{ fontSize: '0.85em', color: '#666' }}>
                {(rec.size / 1024 / 1024).toFixed(1)} MB
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
