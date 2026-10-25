"""Pydantic models for API responses.

DB Schema (from nvr.sqlite3):
cameras: id TEXT PK (32-hex), name, slug (unique), rtsp_url, audio_url, enabled,
         segment_seconds, retention_days, schedule_json, record_audio, grayscale_mode,
         live_view_mode, view_rotation, rtsp_transport, ptz_*, onvif_*, created_at, updated_at
recorder_events: id INTEGER PK, camera_id FK, level, message, created_at (event log, not recordings)
users: username PK, password_hash, created_at, updated_at
sessions: id PK, username FK, created_at, last_seen_at, expires_at
app_settings: key PK, value, updated_at
"""
from pydantic import BaseModel
from typing import Optional


class Camera(BaseModel):
    """Camera information from database."""
    id: str
    slug: str
    name: str
    rtsp_url: str
    segment_seconds: int
    enabled: int


class Recording(BaseModel):
    """A single video segment (from filesystem scan)."""
    id: str  # base64-encoded file path for /api/video/{id}
    camera_id: str
    file_path: str
    start: str  # ISO 8601
    end: Optional[str]  # ISO 8601 or None for last segment
    size: int


class DiskUsage(BaseModel):
    """Disk usage statistics."""
    total: int  # bytes
    used: int   # bytes
    free: int   # bytes
    percent: float  # percentage used
