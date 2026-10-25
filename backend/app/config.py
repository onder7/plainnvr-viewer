"""Configuration settings for PlainNVR viewer backend."""
import os
from pathlib import Path

# Environment variables with defaults
NVR_VIDEO_ROOT = Path(os.getenv("NVR_VIDEO_ROOT", "/mnt/DATA/nv1"))
NVR_DB_PATH = Path(os.getenv("NVR_DB_PATH", "/mnt/DATA/nv1/nvr.sqlite3"))

# Auth settings
VIEWER_PASSWORD = os.getenv("VIEWER_PASSWORD", "plainnvr")  # Default password
JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production-please")  # Change in production!
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24

# Config files to skip when scanning for camera folders
CONFIG_FILES = {
    "docker-compose.yml",
    "go2rtc.json",
    "go2rtc.log",
    "nvr.sqlite3"
}
