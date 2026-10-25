"""System information endpoints."""
from fastapi import APIRouter
import shutil
from ..models import DiskUsage

router = APIRouter()


@router.get("/system/disk", response_model=DiskUsage)
def get_disk_usage():
    """Get disk usage statistics for NVR storage."""
    from ..config import NVR_VIDEO_ROOT
    
    try:
        stat = shutil.disk_usage(NVR_VIDEO_ROOT)
        return DiskUsage(
            total=stat.total,
            used=stat.used,
            free=stat.free,
            percent=round((stat.used / stat.total) * 100, 1)
        )
    except Exception as e:
        # Return zeros if there's an error
        return DiskUsage(total=0, used=0, free=0, percent=0.0)
