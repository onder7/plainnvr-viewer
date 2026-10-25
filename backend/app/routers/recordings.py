"""Recordings listing endpoints."""
from fastapi import APIRouter, Query
from typing import List, Optional
from datetime import date as date_class
import base64

from ..db import query_cameras
from ..fsindex import scan_recordings, get_recording_dates
from ..models import Recording
from ..config import NVR_DB_PATH, NVR_VIDEO_ROOT

router = APIRouter()


@router.get("/recordings", response_model=List[Recording])
def list_recordings(
    camera_id: str = Query(..., description="Camera ID"),
    date: Optional[str] = Query(None, description="Date filter (YYYY-MM-DD)")
):
    """Get recordings for a camera, optionally filtered by date."""
    # Find camera
    cameras = query_cameras(NVR_DB_PATH)
    camera = next((c for c in cameras if c["id"] == camera_id), None)
    
    if not camera:
        return []
    
    # Parse date filter
    target_date = None
    if date:
        try:
            target_date = date_class.fromisoformat(date)
        except ValueError:
            return []
    
    # Scan filesystem
    recordings = scan_recordings(camera, NVR_VIDEO_ROOT, target_date)
    
    # Add ID (base64-encoded path) and camera_id
    for rec in recordings:
        rec["id"] = base64.urlsafe_b64encode(rec["file_path"].encode()).decode()
        rec["camera_id"] = camera_id
    
    return recordings


@router.get("/dates")
def list_dates(
    camera_id: str = Query(..., description="Camera ID"),
    year: int = Query(..., description="Year (e.g., 2026)"),
    month: int = Query(..., description="Month (1-12)")
):
    """Get list of days that have recordings for a camera in a given year-month."""
    # Find camera
    cameras = query_cameras(NVR_DB_PATH)
    camera = next((c for c in cameras if c["id"] == camera_id), None)
    
    if not camera:
        return {"days": []}
    
    days = get_recording_dates(camera, NVR_VIDEO_ROOT, year, month)
    return {"days": days}
