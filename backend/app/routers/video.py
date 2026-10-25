"""Video streaming endpoint with Range support."""
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path
import base64

from ..config import NVR_VIDEO_ROOT

router = APIRouter()


@router.get("/video/{recording_id}")
def stream_video(recording_id: str):
    """Stream a video file with HTTP Range support (for seeking).
    
    Args:
        recording_id: base64-encoded file path
        
    Returns:
        FileResponse with Range support
    """
    # Decode path
    try:
        file_path_str = base64.urlsafe_b64decode(recording_id.encode()).decode()
        file_path = Path(file_path_str)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid recording ID")
    
    # Security: validate path is inside NVR_VIDEO_ROOT (prevent path traversal)
    try:
        resolved = file_path.resolve()
        if not str(resolved).startswith(str(NVR_VIDEO_ROOT.resolve())):
            raise HTTPException(status_code=403, detail="Access denied")
    except Exception:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check file exists
    if not resolved.exists() or not resolved.is_file():
        raise HTTPException(status_code=404, detail="Recording not found")
    
    # Check file extension
    if resolved.suffix.lower() != ".mp4":
        raise HTTPException(status_code=415, detail="Unsupported media type")
    
    # Return file with Range support (FileResponse handles it automatically)
    return FileResponse(
        path=resolved,
        media_type="video/mp4",
        filename=resolved.name
    )
