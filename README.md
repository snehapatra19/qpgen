# QPGen — AI Question Paper Generator

Full-stack web app that auto-generates question papers & answers from study materials using Claude AI. Supports MCQ, Short, Long answer types with Bloom's Taxonomy classification and PDF export.

## Stack
- **Backend:** FastAPI + Python
- **Frontend:** React 18 + Recharts
- **LLM:** Anthropic Claude API (with rule-based fallback)
- **Export:** PDF via ReportLab, TXT

## Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Features
- Upload PDF, DOCX, PPTX, TXT
- Generate MCQ, Short, Long, True/False, Fill-in-blank
- Bloom's Taxonomy classification
- PDF & TXT export
- Analytics dashboard
- Feedback system
