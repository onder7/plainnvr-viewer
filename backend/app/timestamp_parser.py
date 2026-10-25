"""Parse PlainNVR MP4 filename timestamps.

Filename format: YYYYMMDDTHHMMSS.mp4 (ISO 8601 basic format)
Example: 20261023T051004.mp4 → 2026-10-23 05:10:04
"""
from datetime import datetime
from pathlib import Path


def parse_timestamp(filename: str) -> datetime:
    """Parse timestamp from PlainNVR MP4 filename.
    
    Args:
        filename: Filename like "20261023T051004.mp4"
        
    Returns:
        datetime object
        
    Raises:
        ValueError: if filename doesn't match expected format
    """
    stem = Path(filename).stem
    return datetime.strptime(stem, "%Y%m%dT%H%M%S")
