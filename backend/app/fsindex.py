"""Filesystem indexer for PlainNVR recordings.

Since PlainNVR has no recordings table in the DB, we scan the filesystem
to build a list of available video segments.

Folder naming is inconsistent — for each camera we try up to 3 candidate folders:
(a) cameras.slug
(b) last octet of RTSP host IP
(c) full IP with dots replaced by dashes
"""
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime, date
from urllib.parse import urlparse
import logging

from .timestamp_parser import parse_timestamp
from .config import NVR_VIDEO_ROOT, CONFIG_FILES

logger = logging.getLogger(__name__)


def get_candidate_folders(camera: Dict[str, Any], video_root: Path) -> List[Path]:
    """Get up to 3 candidate folder paths for a camera.
    
    Args:
        camera: Camera dict with 'slug' and 'rtsp_url' keys
        video_root: NVR_VIDEO_ROOT path
        
    Returns:
        List of Path objects for candidate folders (may not all exist)
    """
    candidates = []
    
    # (a) Slug folder
    slug_folder = video_root / camera["slug"]
    candidates.append(slug_folder)
    
    # (b) & (c) IP-based folders
    try:
        hostname = urlparse(camera["rtsp_url"]).hostname
        if hostname:
            # (b) Last octet
            last_octet = hostname.rsplit(".", 1)[-1]
            candidates.append(video_root / last_octet)
            
            # (c) Full IP with dashes
            ip_dashed = hostname.replace(".", "-")
            candidates.append(video_root / ip_dashed)
    except Exception as e:
        logger.warning(f"Failed to parse rtsp_url for camera {camera['slug']}: {e}")
    
    return candidates


def scan_recordings(
    camera: Dict[str, Any],
    video_root: Path,
    target_date: Optional[date] = None
) -> List[Dict[str, Any]]:
    """Scan filesystem for recordings from a camera.
    
    Args:
        camera: Camera dict from DB
        video_root: NVR_VIDEO_ROOT path
        target_date: Optional date to filter (only scan files from this day)
        
    Returns:
        List of recording dicts with keys: file_path, start, end (optional), size
        Sorted by start time, deduplicated by (start, size)
    """
    recordings = []
    seen = set()  # For deduplication: (start_timestamp, size)
    
    # Try all candidate folders
    candidate_folders = get_candidate_folders(camera, video_root)
    
    for folder in candidate_folders:
        if not folder.exists() or not folder.is_dir():
            continue
            
        # Build glob pattern
        if target_date:
            pattern = f"{target_date.strftime('%Y%m%d')}T*.mp4"
        else:
            pattern = "*.mp4"
        
        # Scan folder
        for mp4_file in folder.glob(pattern):
            try:
                start = parse_timestamp(mp4_file.name)
                size = mp4_file.stat().st_size
                
                # Dedupe key
                key = (start.timestamp(), size)
                if key in seen:
                    continue
                seen.add(key)
                
                recordings.append({
                    "file_path": str(mp4_file),
                    "start": start.isoformat(),
                    "end": None,  # Will be filled by next segment's start
                    "size": size
                })
            except Exception as e:
                logger.warning(f"Failed to parse {mp4_file}: {e}")
    
    # Sort by start time
    recordings.sort(key=lambda r: r["start"])
    
    # Fill 'end' times using next segment's start
    for i in range(len(recordings) - 1):
        recordings[i]["end"] = recordings[i + 1]["start"]
    
    return recordings


def get_recording_dates(
    camera: Dict[str, Any],
    video_root: Path,
    year: int,
    month: int
) -> List[int]:
    """Get list of days (1-31) that have recordings for a camera in a given month.
    
    Args:
        camera: Camera dict from DB
        video_root: NVR_VIDEO_ROOT path
        year: Year (e.g., 2026)
        month: Month (1-12)
        
    Returns:
        Sorted list of day numbers (1-31) that have recordings
    """
    days_set = set()
    candidate_folders = get_candidate_folders(camera, video_root)
    
    for folder in candidate_folders:
        if not folder.exists() or not folder.is_dir():
            continue
        
        # Glob pattern for this year-month
        pattern = f"{year:04d}{month:02d}??T*.mp4"
        
        for mp4_file in folder.glob(pattern):
            try:
                start = parse_timestamp(mp4_file.name)
                days_set.add(start.day)
            except Exception:
                pass
    
    return sorted(days_set)
