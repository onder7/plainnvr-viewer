"""SQLite database connection helper (read-only mode)."""
import sqlite3
from typing import List, Dict, Any
from pathlib import Path


def get_db_connection(db_path: Path) -> sqlite3.Connection:
    """Create a read-only SQLite connection.
    
    Args:
        db_path: Path to nvr.sqlite3
        
    Returns:
        sqlite3.Connection in read-only mode
    """
    # URI mode with read-only flag prevents any writes
    # Convert Path to string for sqlite3
    uri = f"file:{str(db_path)}?mode=ro"
    conn = sqlite3.connect(uri, uri=True)
    conn.row_factory = sqlite3.Row  # Access columns by name
    return conn


def query_cameras(db_path: Path) -> List[Dict[str, Any]]:
    """Fetch all enabled cameras from the database.
    
    Args:
        db_path: Path to nvr.sqlite3
        
    Returns:
        List of camera dicts with keys: id, slug, name, rtsp_url, segment_seconds, enabled
    """
    conn = get_db_connection(db_path)
    try:
        cursor = conn.execute(
            "SELECT id, slug, name, rtsp_url, segment_seconds, enabled "
            "FROM cameras WHERE enabled = 1"
        )
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()
