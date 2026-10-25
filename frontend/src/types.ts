/**
 * TypeScript types matching backend models
 */

export interface ScheduleTimeRange {
  start: string;
  end: string;
}

export interface Schedule {
  mode: 'always' | 'weekly';
  days?: {
    [day: string]: ScheduleTimeRange[];
  };
}

export interface Camera {
  id: string;
  slug: string;
  name: string;
  rtsp_url: string;
  segment_seconds: number;
  enabled: number;
  retention_days?: number;
  schedule?: Schedule;
  live_view_mode?: string;
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
  days: number[];
}
