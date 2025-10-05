"""Market Service - FastAPI application entry point"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from routes.market import router as market_router
from routes.websocket import router as websocket_router

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    logger.info("Market Service starting up...")
    logger.info(f"Running on {settings.host}:{settings.port} (internal only)")

    # Start WebSocket manager
    from websocket_manager import ws_manager
    await ws_manager.start()

    yield

    # Stop WebSocket manager
    await ws_manager.stop()
    logger.info("Market Service shutting down...")


# Create FastAPI app (单应用，REST + WebSocket)
app = FastAPI(
    title="TrackMyMoney Market Service",
    description="Market data service using Yahoo Finance API (internal use only)",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS (仅允许后端访问)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return JSONResponse(content={"status": "healthy", "service": "market"}, status_code=200)


# Include routers
app.include_router(market_router)  # REST API
app.include_router(websocket_router)  # WebSocket


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500, content={"code": 500, "message": f"Internal server error: {str(exc)}", "data": None}
    )


if __name__ == "__main__":
    import uvicorn

    logger.info("=" * 60)
    logger.info("TrackMyMoney Market Service")
    logger.info(f"Listening on {settings.host}:{settings.port} (internal only)")
    logger.info("=" * 60)

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="debug" if settings.debug else "info",
    )
