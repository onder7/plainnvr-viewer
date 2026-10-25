"""PlainNVR Viewer - FastAPI Backend."""
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import auth, cameras, recordings, video
from .auth import verify_token

app = FastAPI(
    title="PlainNVR Viewer API",
    description="Read-only API for viewing PlainNVR recordings",
    version="1.0.0"
)

# CORS - allow frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(cameras.router, prefix="/api", tags=["cameras"])
app.include_router(recordings.router, prefix="/api", tags=["recordings"])
app.include_router(video.router, prefix="/api", tags=["video"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])


@app.get("/api/health", dependencies=[Depends(verify_token)])
def health_check():
    """Health check endpoint."""
    return {"status": "ok"}
