"""Contact form API routes"""
from fastapi import APIRouter, HTTPException
from app.models.contact import ContactRequest
from app.services.email_service import send_contact_email

router = APIRouter(prefix="/api/contact", tags=["contact"])


@router.post("/submit")
async def submit_contact(request: ContactRequest) -> dict[str, str]:
    """
    Submit contact form - type checked with MyPy
    
    Args:
        request: Contact form data
        
    Returns:
        Success message
        
    Raises:
        HTTPException: If email sending fails
    """
    try:
        await send_contact_email(request)
        return {
            "status": "success",
            "message": "Thank you for your message! We will get back to you soon."
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send email: {str(e)}"
        )

