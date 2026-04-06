# 🚀 ResumeRanker — AI-Powered Talent Screening

> **Modern, Semantic Recruitment Intelligence.** Rank resumes against job specifications using NLP and deep learning embeddings. Built for high-performance HR teams.

---

## ✨ Features

- 📄 **Multi-Format Parsing** — Supports PDF (advanced layout parsing), DOCX, and TXT.
- 🧠 **Semantic AI Ranking** — Uses `all-MiniLM-L6-v2` transformers to understand experience beyond just keywords.
- 🔍 **Automated Skill Extraction** — Detects 100+ technical and soft skills across modern tech stacks.
- 📊 **Recruiter Dashboard** — Real-time analytics, match percentage bars, and score distribution charts.
- 🎯 **Contact & Social Discovery** — Auto-extracts emails, phone numbers, and LinkedIn/GitHub profiles.
- 💡 **SaaS-First UI** — Clean, modern light-themed interface with smooth animations and drag-and-drop support.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Core Service** | Python 3.10+ · FastAPI |
| **NLP Engine** | sentence-transformers · scikit-learn · PyTorch |
| **Document Processing**| PyMuPDF (PDF) · python-docx (DOCX) |
| **Frontend** | Vanilla JS · Chart.js · Lucide Icons · CSS3 |

---

## ⚡ Quick Start (5 Minutes)

### 1. Configure the Environment
Clone the repository and install the backend dependencies:
```bash
cd resume-ranker/backend
pip install -r requirements.txt
```
*Note: The first run will automatically download the BERT model (~90 MB).*

### 2. Launch the Engine
Start the FastAPI server:
```bash
python main.py
```
The system will be live at `http://localhost:8000`.

### 3. Access the Dashboard
Open your browser and navigate to `http://localhost:8000` to access the full SaaS interface.

---

## 📁 Project Structure

```text
resume-ranker/
├── backend/
│   ├── main.py         # FastAPI Gateway & Application Logic
│   ├── parser.py       # Multi-format Document Extraction
│   ├── ranker.py       # AI Scoring Engine (Sentence Embeddings)
│   ├── skills.py       # NLP Skill Taxonomy & Recognition
│   └── requirements.txt # Project Dependencies
└── frontend/
    ├── index.html      # Responsive SaaS Dashboard
    ├── style.css       # Premium Light Design System
    └── app.js          # Interactive UI & API Client
```

---

## 📊 Recruitment Analytics
The results dashboard provides detailed visualizations for candidate comparison:
1. **Match Score Distribution**: Compare the top 10 candidates side-by-side.
2. **Skill Density**: View the most prevalent skills across the current talent pool.
3. **Semantic Alignment**: Match percentages based on conceptual similarity to the job description.

---

## 🔒 License
Built for educational and professional demonstration. [MIT License](LICENSE)

*Built with ❤️ for the modern HR professional.*
