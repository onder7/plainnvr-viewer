/**
 * Main viewer page - 3-column layout
 */
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { getCameras, getRecordings } from '../api/client';
import type { Camera, Recording } from '../types';

import CameraList from '../components/CameraList';
import CalendarPicker from '../components/CalendarPicker';
import RecordingList from '../components/RecordingList';
import VideoPlayer from '../components/VideoPlayer';

export default function ViewerPage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [selectedRecordingId, setSelectedRecordingId] = useState<string | null>(null);

  // Load cameras on mount
  useEffect(() => {
    getCameras()
      .then((data) => {
        setCameras(data);
        if (data.length > 0) {
          setSelectedCameraId(data[0].id);
        }
      })
      .catch((err) => console.error('Failed to load cameras:', err));
  }, []);

  // Load recordings when camera or date changes
  useEffect(() => {
    if (!selectedCameraId) {
      setRecordings([]);
      return;
    }

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    getRecordings(selectedCameraId, dateStr)
      .then((data) => {
        setRecordings(data);
        setSelectedRecordingId(null); // Clear selection when list changes
      })
      .catch((err) => console.error('Failed to load recordings:', err));
  }, [selectedCameraId, selectedDate]);

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      {/* Left column: Camera list */}
      <div style={{ width: '250px', padding: '16px', borderRight: '1px solid #ddd', overflowY: 'auto' }}>
        <CameraList
          cameras={cameras}
          selectedCameraId={selectedCameraId}
          onSelectCamera={setSelectedCameraId}
        />
      </div>

      {/* Middle column: Calendar + Recording list */}
      <div style={{ width: '400px', padding: '16px', borderRight: '1px solid #ddd', overflowY: 'auto' }}>
        <CalendarPicker
          cameraId={selectedCameraId}
          onSelectDate={setSelectedDate}
        />
        <div style={{ marginTop: '24px' }}>
          <RecordingList
            recordings={recordings}
            selectedRecordingId={selectedRecordingId}
            onSelectRecording={setSelectedRecordingId}
          />
        </div>
      </div>

      {/* Right column: Video player */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
        <VideoPlayer recordingId={selectedRecordingId} />
      </div>
    </div>
  );
}
