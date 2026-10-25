"""Recordings listing endpoints."""
from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from datetime import date as date_class
import base64

from ..cache import TTLCache
from ..db import query_camera
from ..fsindex import scan_recordings, get_recording_dates
from ..models import Recording
from ..config import NVR_DB_PATH, NVR_VIDEO_ROOT
from ..auth import verify_token

router = APIRouter()
# Recordings change frequently, while month availability changes less often.
_RECORDINGS_CACHE: TTLCache[List[dict]] = TTLCache(ttl_seconds=5)
_DATES_CACHE: TTLCache[List[int]] = TTLCache(ttl_seconds=30)


@router.get("/recordings", response_model=List[Recording], dependencies=[Depends(verify_token)])
def list_recordings(
    camera_id: str = Query(..., description="Camera ID"),
    date: Optional[str] = Query(None, description="Date filter (YYYY-MM-DD)")
):
    """Get recordings for a camera, optionally filtered by date."""
    camera = query_camera(NVR_DB_PATH, camera_id)
    if not camera:
        return []

    target_date = None
    if date:
        try:
            target_date = date_class.fromisoformat(date)
        except ValueError:
            return []

    cache_key = f"{camera_id}:{target_date.isoformat() if target_date else 'all'}"
    recordings = _RECORDINGS_CACHE.get(cache_key)
    if recordings is None:
        recordings = _RECORDINGS_CACHE.set(
            cache_key,
            scan_recordings(camera, NVR_VIDEO_ROOT, target_date),
        )

    # Do not mutate cached scan records while decorating the API response.
    response = []
    for recording in recordings:
        item = dict(recording)
        item["id"] = base64.urlsafe_b64encode(item["file_path"].encode()).decode()
        item["camera_id"] = camera_id
        response.append(item)
    return response


@router.get("/dates", dependencies=[Depends(verify_token)])
def list_dates(
    camera_id: str = Query(..., description="Camera ID"),
    year: int = Query(..., description="Year (e.g., 2026)"),
    month: int = Query(..., description="Month (1-12)")
):
    """Get list of days that have recordings for a camera in a given year-month."""
    camera = query_camera(NVR_DB_PATH, camera_id)
    if not camera:
        return {"days": []}

    cache_key = f"{camera_id}:{year:04d}-{month:02d}"
    days = _DATES_CACHE.get(cache_key)
    if days is None:
        days = _DATES_CACHE.set(
            cache_key,
            get_recording_dates(camera, NVR_VIDEO_ROOT, year, month),
        )
    return {"days": days}
