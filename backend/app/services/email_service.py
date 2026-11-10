"""Email service for sending contact form emails"""
from app.models.contact import ContactRequest
from app.database import SessionLocal, init_db
from app.models.message import ContactMessage
import os

# Initialize database on first import
try:
    init_db()
except Exception:
    pass  # Database might already be initialized


async def send_contact_email(request: ContactRequest) -> None:
    """
    Save contact form submission to database
    
    Args:
        request: Contact form data
        
    Raises:
        Exception: If saving fails
    """
    db = SessionLocal()
    try:
        message = ContactMessage(
            name=request.name,
            email=request.email,
            company=request.company,
            phone=request.phone,
            service=request.service,
            message=request.message
        )
        db.add(message)
        db.commit()
        print(f"Contact form saved to database: {request.name} - {request.email}")
    except Exception as e:
        db.rollback()
        print(f"Error saving message to database: {e}")
        # Still log to console as backup
        print(f"Contact form submission (backup log):")
        print(f"Name: {request.name}")
        print(f"Email: {request.email}")
        print(f"Company: {request.company}")
        print(f"Phone: {request.phone}")
        print(f"Service: {request.service}")
        print(f"Message: {request.message}")
        raise
    finally:
        db.close()

