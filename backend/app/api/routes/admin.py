"""Admin API routes"""
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.message import ContactMessage
from pydantic import BaseModel
from typing import List
from datetime import datetime
import os
import secrets

from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Set ADMIN_PASSWORD in backend/.env. There is deliberately no built-in default:
# if it isn't set, every admin login is refused.
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")


def _password_ok(candidate: str) -> bool:
    """Constant-time comparison; always false when no admin password is configured."""
    return bool(ADMIN_PASSWORD) and secrets.compare_digest(candidate.encode(), ADMIN_PASSWORD.encode())


class LoginRequest(BaseModel):
    password: str


class MessageResponse(BaseModel):
    id: int
    name: str
    email: str
    company: str | None
    phone: str
    service: str
    message: str
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("/login")
async def login(request: LoginRequest) -> dict[str, str]:
    """Admin login"""
    if _password_ok(request.password):
        return {"status": "success", "message": "Login successful"}
    raise HTTPException(status_code=401, detail="Invalid password")


@router.get("/messages", response_model=List[MessageResponse])
async def get_messages(
    password: str = Query(..., description="Admin password"),
    db: Session = Depends(get_db)
) -> List[MessageResponse]:
    """Get all contact messages"""
    if not _password_ok(password):
        raise HTTPException(status_code=401, detail="Invalid password")
    
    messages = db.query(ContactMessage).order_by(ContactMessage.created_at.desc()).all()
    return messages

