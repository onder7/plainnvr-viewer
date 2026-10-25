"""Camera listing endpoint."""
from fastapi import APIRouter, Depends
from typing import List

from ..db import query_cameras
from ..models import Camera
from ..config import NVR_DB_PATH
from ..auth import verify_token

router = APIRouter()


@router.get("/cameras", response_model=List[Camera], dependencies=[Depends(verify_token)])
def list_cameras():
    """Get all enabled cameras from the database."""
    cameras = query_cameras(NVR_DB_PATH)
    return cameras
