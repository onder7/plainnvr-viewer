"""SQLite database connection helper (read-only mode)."""
import sqlite3
import json
from typing import List, Dict, Any
from pathlib import Path
from .cache import TTLCache


_CAMERAS_CACHE: TTLCache[List[Dict[str, Any]]] = TTLCache(ttl_seconds=30)


def get_db_connection(db_path: Path) -> sqlite3.Connection:
    """Create a read-only SQLite connection.
    
    Args:
        db_path: Path to nvr.sqlite3
        
    Returns:
        sqlite3.Connection in read-only mode
    """
    # URI mode with read-only flag prevents any writes
    # immutable=1 tells SQLite not to create temp files
    # Convert Path to string for sqlite3
    uri = f"file:{str(db_path)}?mode=ro&immutable=1"
    conn = sqlite3.connect(uri, uri=True)
    conn.row_factory = sqlite3.Row  # Access columns by name
    return conn


def _parse_schedule(schedule_json: str) -> Dict[str, Any] | None:
    """Parse schedule_json string to dict."""
    try:
        return json.loads(schedule_json) if schedule_json else None
    except (json.JSONDecodeError, TypeError):
        return None


def query_cameras(db_path: Path) -> List[Dict[str, Any]]:
    """Fetch all enabled cameras from the database.
    
    Args:
        db_path: Path to nvr.sqlite3
        
    Returns:
        List of camera dicts with keys: id, slug, name, rtsp_url, segment_seconds, enabled, retention_days, schedule, live_view_mode
    """
    cache_key = str(db_path)
    cached = _CAMERAS_CACHE.get(cache_key)
    if cached is not None:
        return cached

    conn = get_db_connection(db_path)
    try:
        cursor = conn.execute(
            "SELECT id, slug, name, rtsp_url, segment_seconds, enabled, retention_days, schedule_json, live_view_mode "
            "FROM cameras WHERE enabled = 1"
        )
        cameras = []
        for row in cursor.fetchall():
            camera = dict(row)
            camera['schedule'] = _parse_schedule(camera.pop('schedule_json', None))
            cameras.append(camera)
        return _CAMERAS_CACHE.set(cache_key, cameras)
    finally:
        conn.close()


def query_camera(db_path: Path, camera_id: str) -> Dict[str, Any] | None:
    """Fetch one enabled camera without loading the complete camera list."""
    conn = get_db_connection(db_path)
    try:
        row = conn.execute(
            "SELECT id, slug, name, rtsp_url, segment_seconds, enabled, retention_days, schedule_json, live_view_mode "
            "FROM cameras WHERE id = ? AND enabled = 1",
            (camera_id,),
        ).fetchone()
        if row:
            camera = dict(row)
            camera['schedule'] = _parse_schedule(camera.pop('schedule_json', None))
            return camera
        return None
    finally:
        conn.close()
