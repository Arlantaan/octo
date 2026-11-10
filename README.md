# Octopus Tech - Full Stack Application

Modern full-stack application built with React, TypeScript, Tailwind CSS, Python, FastAPI, and MyPy.

## 🚀 Tech Stack

### Frontend
- **React 18** + **TypeScript** - Modern UI framework with type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations
- **React Hook Form** - Form management
- **Vite** - Fast build tool

### Backend
- **Python 3.11+** - Modern Python
- **FastAPI** - High-performance async API framework
- **MyPy** - Static type checking
- **Pydantic** - Data validation

## 📁 Project Structure

```
.
├── frontend/          # React + TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── types/
│   └── package.json
├── backend/           # Python + FastAPI backend
│   ├── app/
│   │   ├── api/
│   │   ├── services/
│   │   └── models/
│   └── requirements.txt
└── public/            # Original static site (legacy)
```

## 🛠️ Setup

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## ✅ Type Checking

### Frontend (TypeScript)
```bash
cd frontend
npm run build  # TypeScript compilation
```

### Backend (MyPy)
```bash
cd backend
mypy app/
```

## 🎯 Features

- ✅ Modern React components with TypeScript
- ✅ Responsive Tailwind CSS design
- ✅ Smooth Framer Motion animations
- ✅ FastAPI backend with type safety
- ✅ MyPy static type checking
- ✅ Contact form with validation
- ✅ Quote calculator with QR codes
- ✅ Professional UI matching original design

## 📝 Next Steps

1. Set up database (PostgreSQL)
2. Implement email service (SendGrid/AWS SES)
3. Add authentication
4. Deploy to production

