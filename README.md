# QPGen — AI Question Paper and Answer Generator

![Python](https://img.shields.io/badge/Python-3.10+-blue?style=flat-square&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-green?style=flat-square&logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Claude AI](https://img.shields.io/badge/Claude-AI-purple?style=flat-square)

> Full-stack web app that auto-generates structured question papers from any study material using Claude AI + Bloom's Taxonomy classification.

---

## 📸 Screenshots

### 🏠 Home Page
![Home](Screenshot%202026-04-30%20122133.png)

### ⚙️ Configure & Generate
![Generate](Screenshot%202026-04-30%20122200.png)

### 📋 Results — Question Cards
![Results](Screenshot%202026-04-30%20125607.png)

### 📊 Dashboard — Analytics
![Dashboard](Screenshot%202026-04-30%20130047.png)

### 📈 Dashboard — Charts
![Charts](Screenshot%202026-04-30%20130105.png)

### 🔍 Dashboard — Sessions
![Sessions](Screenshot%202026-05-01%20020201.png)

### 📁 File Types & Processing
![Processing](Screenshot%202026-05-01%20020215.png)

---

## ✨ Features

- 📄 Upload **PDF, DOCX, PPTX, TXT** files
- 🤖 AI-powered generation via **Claude API**
- 🧠 **Bloom's Taxonomy** classification — 6 cognitive levels
- 📝 **MCQ, Short, Long, True/False, Fill-in-blank**
- 📊 **Analytics dashboard** with charts
- ⬇️ Export as **PDF or TXT**
- ⭐ Built-in **feedback system**
- ⚡ Under 1 second processing for most files

---

## 🖥️ Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Recharts, React Router |
| Backend | FastAPI, Python 3.10+ |
| AI | Anthropic Claude API |
| Export | ReportLab PDF |

---

## 🚀 Setup

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

---

## 🔑 API Key
Enter your Anthropic API key in the UI, or set as environment variable:
```bash
set ANTHROPIC_API_KEY=sk-ant-...
```
> No API key? The app uses a smart rule-based fallback automatically.

---

## 📁 Project Structure
