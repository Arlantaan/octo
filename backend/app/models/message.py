"""Message storage model"""
from sqlalchemy import Column, Integer, String, DateTime, Text
from app.database import Base
from datetime import datetime


class ContactMessage(Base):
    """Contact message model for database storage"""
    __tablename__ = "contact_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    company = Column(String, nullable=True)
    phone = Column(String, nullable=False)
    service = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

