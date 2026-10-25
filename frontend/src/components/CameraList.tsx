/**
 * Camera selection list component
 */
import type { Camera } from '../types';

interface CameraListProps {
  cameras: Camera[];
  selectedCameraId: string | null;
  onSelectCamera: (cameraId: string) => void;
}

export default function CameraList({
  cameras,
  selectedCameraId,
  onSelectCamera,
}: CameraListProps) {
  return (
    <div className="camera-list">
      <h2>Kameralar</h2>
      <ul>
        {cameras.map((camera) => (
          <li
            key={camera.id}
            className={selectedCameraId === camera.id ? 'selected' : ''}
            onClick={() => onSelectCamera(camera.id)}
            style={{ cursor: 'pointer', padding: '8px', marginBottom: '4px' }}
          >
            {camera.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
