"""Quote API routes"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import uuid
from app.services.qr_generator import generate_quote_qr

router = APIRouter(prefix="/api/quotes", tags=["quotes"])


class QuoteRequest(BaseModel):
    """Quote request model"""
    client_name: str
    client_email: EmailStr
    project_name: str
    services: list[str]
    complexity: float
    timeline: float
    total_price: float


class QuoteResponse(BaseModel):
    """Quote response model"""
    id: str
    client_name: str
    client_email: EmailStr
    project_name: str
    services: list[str]
    complexity: float
    timeline: float
    total_price: float
    date: str
    status: str
    qr_code: Optional[str] = None


@router.post("/create", response_model=QuoteResponse)
async def create_quote(request: QuoteRequest) -> QuoteResponse:
    """
    Create a new quote with QR code validation
    
    Args:
        request: Quote data
        
    Returns:
        Quote with QR code
    """
    try:
        quote_id = f"QT-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        # Generate QR code
        qr_data = {
            "id": quote_id,
            "client": request.client_name,
            "project": request.project_name,
            "total": request.total_price,
            "date": datetime.now().isoformat()
        }
        qr_code = await generate_quote_qr(qr_data)
        
        return QuoteResponse(
            id=quote_id,
            client_name=request.client_name,
            client_email=request.client_email,
            project_name=request.project_name,
            services=request.services,
            complexity=request.complexity,
            timeline=request.timeline,
            total_price=request.total_price,
            date=datetime.now().isoformat(),
            status="pending",
            qr_code=qr_code
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create quote: {str(e)}"
        )


@router.get("/{quote_id}")
async def get_quote(quote_id: str) -> dict[str, str]:
    """
    Get quote by ID (for validation)
    
    Args:
        quote_id: Quote identifier
        
    Returns:
        Quote information
    """
    # In production, fetch from database
    return {"message": f"Quote {quote_id} validation endpoint"}

