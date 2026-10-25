/**
 * HTML5 video player component
 */
import { useEffect, useRef } from 'react';
import { getVideoUrl } from '../api/client';

interface VideoPlayerProps {
  recordingId: string | null;
}

export default function VideoPlayer({ recordingId }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Clean up previous video to prevent memory leaks
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
      videoRef.current.load();
    }

    if (recordingId && videoRef.current) {
      videoRef.current.src = getVideoUrl(recordingId);
      videoRef.current.load();
    }
  }, [recordingId]);

  return (
    <div className="video-player">
      <h2>Oynatıcı</h2>
      {recordingId ? (
        <video
          ref={videoRef}
          controls
          style={{ width: '100%', maxWidth: '800px' }}
        >
          Tarayıcınız video oynatmayı desteklemiyor.
        </video>
      ) : (
        <p>Oynatmak için bir kayıt seçin</p>
      )}
    </div>
  );
}
