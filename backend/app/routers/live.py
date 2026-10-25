"""Live view streaming endpoint - proxy to go2rtc HLS streams."""
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse, RedirectResponse
import httpx
from typing import AsyncGenerator, Optional

from ..db import query_camera
from ..config import NVR_DB_PATH
from ..auth import verify_token_query

router = APIRouter()

# go2rtc default port on TrueNAS
GO2RTC_BASE_URL = "http://localhost:1984"


@router.get("/live/{camera_slug}/stream.m3u8")
async def get_live_stream(camera_slug: str, token: Optional[str] = Query(None)):
    """Proxy HLS master playlist from go2rtc with token authentication."""
    # Verify token from query parameter
    if token:
        from ..auth import verify_token_string
        try:
            verify_token_string(token)
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
    else:
        raise HTTPException(status_code=401, detail="Token required")
    
    # Verify camera exists
    cameras = []
    from ..db import query_cameras
    cameras = query_cameras(NVR_DB_PATH)
    
    camera = next((c for c in cameras if c['slug'] == camera_slug), None)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    # Direct redirect to go2rtc HLS stream (no auth needed on go2rtc side)
    hls_url = f"{GO2RTC_BASE_URL}/api/stream.m3u8?src={camera_slug}"
    return RedirectResponse(url=hls_url)


@router.get("/live/{camera_slug}/channel/{channel}/hls/live/index.m3u8", dependencies=[Depends(verify_token)])
async def get_live_stream_full(camera_slug: str, channel: int = 0):
    """Alternative endpoint matching PlainNVR's go2rtc URL pattern."""
    cameras = []
    from ..db import query_cameras
    cameras = query_cameras(NVR_DB_PATH)
    
    camera = next((c for c in cameras if c['slug'] == camera_slug), None)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    # Redirect to go2rtc HLS stream
    hls_url = f"{GO2RTC_BASE_URL}/api/stream.m3u8?src={camera_slug}"
    return RedirectResponse(url=hls_url)


@router.get("/live/{camera_slug}/snapshot.jpg", dependencies=[Depends(verify_token)])
async def get_snapshot(camera_slug: str):
    """Get current camera snapshot from go2rtc."""
    cameras = []
    from ..db import query_cameras
    cameras = query_cameras(NVR_DB_PATH)
    
    camera = next((c for c in cameras if c['slug'] == camera_slug), None)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    # Proxy snapshot from go2rtc
    snapshot_url = f"{GO2RTC_BASE_URL}/api/frame.jpeg?src={camera_slug}"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(snapshot_url, timeout=5.0)
            response.raise_for_status()
            return StreamingResponse(
                iter([response.content]),
                media_type="image/jpeg",
                headers={
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    "Pragma": "no-cache",
                    "Expires": "0"
                }
            )
        except httpx.HTTPError:
            raise HTTPException(status_code=503, detail="Failed to fetch snapshot from camera")
