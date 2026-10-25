import type { Camera, Recording, RecordingDates, DiskUsage } from '../types'

const API_BASE = '/api'
const TOKEN_KEY = 'plainnvr_access_token'

export interface LoginResponse { access_token: string; token_type: string; expires_in: number }

export function getStoredToken(): string | null { return localStorage.getItem(TOKEN_KEY) }
export function saveToken(token: string): void { localStorage.setItem(TOKEN_KEY, token) }
export function clearToken(): void { localStorage.removeItem(TOKEN_KEY) }

async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  const token = getStoredToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(input, { ...init, headers })
  if (response.status === 401) {
    clearToken()
    window.dispatchEvent(new CustomEvent('plainnvr-auth-expired'))
  }
  return response
}

export async function login(password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }),
  })
  if (!response.ok) throw new Error('Incorrect password')
  return response.json()
}

export async function getCameras(): Promise<Camera[]> {
  const response = await apiFetch(`${API_BASE}/cameras`)
  if (!response.ok) throw new Error('Failed to fetch cameras')
  return response.json()
}

export async function getRecordings(cameraId: string, date: string, signal?: AbortSignal): Promise<Recording[]> {
  const url = `${API_BASE}/recordings?camera_id=${encodeURIComponent(cameraId)}&date=${encodeURIComponent(date)}`
  const response = await apiFetch(url, { signal })
  if (!response.ok) throw new Error('Failed to fetch recordings')
  return response.json()
}

export async function getRecordingDates(cameraId: string, year: number, month: number, signal?: AbortSignal): Promise<RecordingDates> {
  const url = `${API_BASE}/dates?camera_id=${encodeURIComponent(cameraId)}&year=${year}&month=${month}`
  const response = await apiFetch(url, { signal })
  if (!response.ok) throw new Error('Failed to fetch recording dates')
  return response.json()
}

export function getVideoUrl(recordingId: string): string {
  const token = getStoredToken()
  return `${API_BASE}/video/${recordingId}?token=${encodeURIComponent(token ?? '')}`
}

export function getLiveStreamUrl(cameraSlug: string): string {
  return `${API_BASE}/live/${cameraSlug}/stream.m3u8`
}

export function getSnapshotUrl(cameraSlug: string): string {
  const token = getStoredToken()
  return `${API_BASE}/live/${cameraSlug}/snapshot.jpg?token=${encodeURIComponent(token ?? '')}`
}

export async function getDiskUsage(): Promise<DiskUsage> {
  const response = await apiFetch(`${API_BASE}/system/disk`)
  if (!response.ok) throw new Error('Failed to fetch disk usage')
  return response.json()
}
