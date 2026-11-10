# Backend API - Octopus Tech

## Local Development Setup

### 1. Create Virtual Environment

**Windows:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
```

**Linux/Mac:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Start Backend Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Test Endpoints

- **Health Check**: http://localhost:8000/api/health
- **API Docs**: http://localhost:8000/api/docs
- **Contact Form**: http://localhost:8000/api/contact/submit (POST)

---

## Quick Start (Windows)

```batch
.\test-backend-local.bat
```

---

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app
│   ├── api/
│   │   ├── routes/
│   │   │   ├── contact.py   # Contact form endpoint
│   │   │   └── quotes.py    # Quote generation endpoint
│   ├── services/
│   │   ├── email_service.py # Email sending
│   │   └── qr_generator.py  # QR code generation
│   └── models/              # Database models (future)
├── requirements.txt
└── pyproject.toml           # MyPy configuration
```

---

## API Endpoints

### Contact Form
- **POST** `/api/contact/submit`
- **Body**: `{ name, email, company?, phone, service, message }`
- **Response**: `{ status: "success", message: "..." }`

### Health Check
- **GET** `/api/health`
- **Response**: `{ status: "healthy" }`

### API Documentation
- **GET** `/api/docs` - Swagger UI
- **GET** `/api/redoc` - ReDoc

---

## Testing Locally

1. Start backend: `uvicorn app.main:app --reload --port 8000`
2. Start frontend: `cd frontend && npm run dev`
3. Test contact form at http://localhost:3000/contact

---

## Deployment

Backend is deployed to Hetzner server via `deploy-all.bat`

Service runs as: `octopustech-api` (systemd)
