"""Contact form models"""
from pydantic import BaseModel, EmailStr
from typing import Optional


class ContactRequest(BaseModel):
    """Contact form request model"""
    name: str
    email: EmailStr
    company: Optional[str] = None
    phone: str
    service: str
    message: str

