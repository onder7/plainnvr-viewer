"""PlainNVR Viewer - FastAPI Backend."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import cameras, recordings, video

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


@app.get("/api/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok"}
