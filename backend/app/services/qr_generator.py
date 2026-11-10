"""QR code generation service"""
import qrcode
import base64
from io import BytesIO
from typing import Any


async def generate_quote_qr(data: dict[str, Any]) -> str:
    """
    Generate QR code for quote validation
    
    Args:
        data: Quote data to encode
        
    Returns:
        Base64 encoded QR code image
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(str(data))
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="#22c55e", back_color="#ffffff")
    
    # Convert to base64
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    
    return f"data:image/png;base64,{img_str}"

