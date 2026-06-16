# CareerFlow AI

## 📌 About

**CareerFlow AI** is an AI-powered job recruitment platform that streamlines the hiring process for both job seekers and hiring managers. It leverages a hybrid AI approach combining Google Gemini and Groq AI to automate CV screening, job matching, interview scheduling, and meeting summaries.

---

## ✨ Features

### For Job Seekers
- One-time CV upload with preferred job categories
- Smart job matching based on skills and preferences
- One-click apply with auto-submission to hiring managers
- Automated interview scheduling (Google Meet + Calendar)
- AI-generated meeting summaries with action items

### For Hiring Managers
- Easy job posting (Title, Description, Requirements, Salary)
- Automated application management with AI-extracted skills
- AI-powered top applicant identification with instant notifications
- One-click interview scheduling with Google Meet + Calendar
- Smart meeting management with transcription and structured summaries

### Shared Features
- Auto Google Calendar + Meet scheduling
- Voice recording → Whisper + Groq AI summary
- Auto follow-up emails + dashboard

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React + TypeScript |
| Backend | Express.js (Node.js) |
| Database | Firebase (User Data, Jobs, Meetings, History) |
| Speech AI | Whisper (Speech-to-Text) |
| AI Models | Google Gemini API + Groq AI (LLaMA 3.3 70B) |
| Integrations | Google OAuth, Calendar API, Gmail API, Google Meet |
| Output | Auto PDF/Word download + scheduled emails |

---

## 🤖 Hybrid AI Approach

### Gemini API
- Analyzes CV, extracts skills/experience
- Scores job matches (80–100% relevance)
- Avoids duplicate jobs

### Groq AI + Whisper
- Real-time speech-to-text transcription
- Structured JSON summary (key points, decisions, action items with assignees & deadlines)

### Hybrid Advantage
- More accurate and useful than single AI model
- Gemini understands career profiles
- Groq creates smarter meeting summaries tied to job search
- Automated follow-up tasks with Firebase integration

---

## 📊 Database Structure

| Collection | Description |
|------------|-------------|
| Candidates Application | Job applications with status |
| Candidates Profile | User profiles with CV data |
| Jobs | Job postings with details |
| Meetings | Interview schedules and summaries |
| Users | All platform users |

---

## 📧 Email Notifications

- **Candidate**: Meeting invitations with details
- **Hirer**: Application received notifications
- **Meeting Summary**: AI-generated summaries from Fathom tool
- **Error Handling**: Email notifications for incorrect meeting information

---

## 👤 Developer

**Simaab Malik**  
SAP ID: 54910  
BS Software Engineering  
Riphah International University  
**Supervisor**: Ma'am Habiba Khatoon  
**Session**: Spring 2026 - 6th Sem

---

## 📄 License

Educational Project - Generative AI Course

---

*For complete details, refer to the project documentation.*
