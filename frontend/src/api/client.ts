/**
 * Backend API client
 */
import type { Camera, Recording, RecordingDates } from '../types';

const API_BASE = '/api';

export async function getCameras(): Promise<Camera[]> {
  const response = await fetch(`${API_BASE}/cameras`);
  if (!response.ok) {
    throw new Error('Failed to fetch cameras');
  }
  return response.json();
}

export async function getRecordings(
  cameraId: string,
  date: string // YYYY-MM-DD
): Promise<Recording[]> {
  const url = `${API_BASE}/recordings?camera_id=${encodeURIComponent(cameraId)}&date=${encodeURIComponent(date)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch recordings');
  }
  return response.json();
}

export async function getRecordingDates(
  cameraId: string,
  year: number,
  month: number
): Promise<RecordingDates> {
  const url = `${API_BASE}/dates?camera_id=${encodeURIComponent(cameraId)}&year=${year}&month=${month}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch recording dates');
  }
  return response.json();
}

export function getVideoUrl(recordingId: string): string {
  return `${API_BASE}/video/${recordingId}`;
}
