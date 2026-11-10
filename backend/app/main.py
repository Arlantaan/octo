"""Main FastAPI application"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import contact, quotes, admin, ai

app = FastAPI(
    title="Octopus Tech API",
    description="Backend API for Octopus Tech digital agency",
    version="1.0.0",
)

# CORS middleware - Allow all origins in production (or specify your domain)
import os
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://91.99.78.37,http://octopustech.org,https://octopustech.org"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(contact.router)
app.include_router(quotes.router)
app.include_router(admin.router)
app.include_router(ai.router)


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint"""
    return {"message": "Octopus Tech API", "version": "1.0.0"}


@app.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint"""
    return {"status": "healthy"}

