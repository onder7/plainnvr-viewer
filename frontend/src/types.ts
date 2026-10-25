/**
 * TypeScript types matching backend models
 */

export interface Camera {
  id: string;
  slug: string;
  name: string;
  rtsp_url: string;
  segment_seconds: number;
  enabled: number;
}

export interface Recording {
  id: string;
  camera_id: string;
  file_path: string;
  start: string; // ISO 8601
  end: string | null; // ISO 8601 or null for last segment
  size: number;
}

export interface DiskUsage {
  total: number;
  used: number;
  free: number;
  percent: number;
}

export interface RecordingDates {
  dates: string[];
}
