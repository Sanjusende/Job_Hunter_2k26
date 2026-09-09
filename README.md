# 🤖 Job Hunter Agent

> An AI-powered job discovery and resume matching system that analyzes candidate resumes, aggregates job opportunities, calculates compatibility scores, and delivers automated job alerts.

![Node.js](https://img.shields.io/badge/Node.js-20+-green)
![React](https://img.shields.io/badge/React-18-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green)
![Docker](https://img.shields.io/badge/Docker-Compose-blue)
![License](https://img.shields.io/badge/Status-Active-success)

---

## 📌 Overview

**Job Hunter Agent** is a full-stack, containerized application designed to automate parts of the job-search workflow.

The system allows a candidate to upload a resume in **PDF or DOCX format**. The resume is parsed and analyzed using **Google Gemini AI**, extracting relevant information such as skills, target roles, experience level, and preferred locations.

The application then aggregates job listings from supported providers, compares them with the candidate profile, calculates a match score, and can send matching job alerts through email.

---

## ✨ Key Features

* 📄 Resume upload support for **PDF and DOCX**
* 🤖 AI-powered resume analysis using **Google Gemini**
* 🧠 Automatic skill and profile extraction
* 🎯 Job-to-resume compatibility scoring
* 🔍 Job aggregation from multiple providers
* 📊 Match score and matched skills visualization
* 📧 Automated email job alerts
* ⏰ Background job processing using cron
* 🗄️ MongoDB-based profile and job storage
* 🐳 Multi-container Docker architecture
* 🛡️ File validation, rate limiting, CORS, CSP, and security hardening
* 📱 Responsive React frontend

---

# 🏗️ Architecture

The application follows a containerized service architecture:

```text
                    ┌─────────────────┐
                    │  Client Browser │
                    └────────┬────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │   React + Nginx      │
                  │      Client App      │
                  └──────────┬───────────┘
                             │
                         /api/*
                             │
                             ▼
                  ┌──────────────────────┐
                  │   Node.js + Express  │
                  │      API Server      │
                  └───────┬───────┬──────┘
                          │       │
                          │       └──────────────► Google Gemini AI
                          │
                          ▼
                    ┌───────────┐
                    │  MongoDB  │
                    └─────▲─────┘
                          │
                          │
                  ┌───────┴────────┐
                  │  Cron Worker   │
                  │                │
                  │ • Fetch Jobs   │
                  │ • Match Skills │
                  │ • Send Emails  │
                  └───────┬────────┘
                          │
                          ▼
                    Candidate Email
```

---

# 🛠️ Tech Stack

## Frontend

* React 18
* Vite
* Tailwind CSS
* Axios
* Lucide Icons

## Backend

* Node.js
* Express.js
* Mongoose

## Database

* MongoDB

## AI

* Google Gemini API

## Resume Processing

* Multer
* pdf-parse
* Mammoth

## Job Sources

* RapidAPI JSearch
* Adzuna
* Curated job sources

## Automation

* node-cron
* Nodemailer

## DevOps

* Docker
* Docker Compose
* Nginx

---

# 📁 Project Structure

```text
job-hunter-agent/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ResumeUpload.jsx
│   │   │   ├── JobCard.jsx
│   │   │   ├── MatchBadge.jsx
│   │   │   └── AnalyticsDashboard.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── server/
│   ├── config/
│   │   └── db.js
│   │
│   ├── models/
│   │   ├── UserProfile.js
│   │   └── JobListing.js
│   │
│   ├── services/
│   │   ├── geminiService.js
│   │   ├── jobAggregationService.js
│   │   └── emailService.js
│   │
│   ├── server.js
│   ├── worker.js
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

# 🔄 How It Works

### 1. Upload Resume

The user uploads a resume in:

```text
PDF
DOCX
```

The backend validates the file before processing it.

---

### 2. Resume Parsing

The system extracts text from the uploaded resume using:

* `pdf-parse` for PDF files
* `mammoth` for DOCX files

---

### 3. AI Profile Extraction

The extracted resume content is analyzed using Google Gemini.

The system extracts information such as:

* Candidate name
* Email
* Technical skills
* Experience level
* Target job roles
* Preferred locations

---

### 4. Job Aggregation

The background worker fetches jobs from supported providers.

Jobs are stored and processed for matching.

---

### 5. Job Matching

The system compares:

```text
Candidate Skills
        +
Target Roles
        +
Experience Profile
        ↓
   Job Requirements
        ↓
    Match Score
```

The result includes:

* Match percentage
* Matched skills
* Relevant job information
* Application link

---

### 6. Email Alerts

The cron worker periodically checks for relevant job matches.

Matching jobs can be sent to the candidate through an HTML email digest.

---

# 🚀 Getting Started

## Prerequisites

Make sure you have:

* Node.js 20+
* MongoDB or MongoDB Atlas
* Docker and Docker Compose (recommended)
* Google Gemini API Key (optional if fallback processing is available)

---

# 🐳 Run with Docker

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd job-hunter-agent
```

### 2. Create Environment File

```bash
cp .env.example .env
```

Add your environment variables.

### 3. Start the Application

```bash
docker compose up --build
```

To run in detached mode:

```bash
docker compose up --build -d
```

### 4. Check Container Status

```bash
docker compose ps
```

The application services include:

| Service       | Description                                  |
| ------------- | -------------------------------------------- |
| `client`      | React frontend served through Nginx          |
| `api-server`  | Express API and resume processing            |
| `cron-worker` | Background job fetching and email processing |
| `mongo`       | MongoDB database                             |

---

# 💻 Run Locally Without Docker

## 1. Start MongoDB

Use either:

* Local MongoDB
* MongoDB Atlas

Configure the MongoDB connection in your `.env` file.

---

## 2. Start Backend

```bash
cd server
npm install
npm run dev
```

---

## 3. Start Background Worker

Open another terminal:

```bash
cd server
npm run dev:worker
```

---

## 4. Start Frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Open the application in your browser using the URL provided by Vite.

---

# ⚙️ Environment Variables

Create a `.env` file based on `.env.example`.

Example:

```env
# Google Gemini
GEMINI_API_KEY=

# RapidAPI / JSearch
RAPIDAPI_KEY=
RAPIDAPI_HOST=

# Adzuna
ADZUNA_APP_ID=
ADZUNA_APP_KEY=

# MongoDB
MONGO_URI=

# SMTP
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

> Never commit your actual `.env` file or API keys to GitHub.

---

# 📡 API Endpoints

## Upload Resume

```http
POST /api/resume/upload
```

**Content-Type:**

```text
multipart/form-data
```

**Form Field:**

```text
resume
```

Supported files:

```text
.pdf
.docx
```

---

## Get Job Matches

```http
GET /api/matches/:userId
```

Returns matching jobs for the candidate along with:

* Match score
* Matched skills
* Job title
* Company
* Location
* Application URL
* Job source

---

## Health Check

```http
GET /api/health
```

Example response:

```json
{
  "status": "ok",
  "dbConnected": true
}
```

---

# 🛡️ Security Features

The application includes several security-focused protections:

* File type validation
* File size restrictions
* File signature verification
* API rate limiting
* Helmet security headers
* Content Security Policy
* CORS restrictions
* NoSQL injection sanitization
* Prompt injection boundaries for AI resume processing
* Secret masking in logs
* Non-root container execution

---

# 🧠 Resume Matching Flow

```text
        Resume
           │
           ▼
   Text Extraction
           │
           ▼
    Gemini AI Analysis
           │
           ▼
    Candidate Profile
           │
           ├──────────────┐
           │              │
           ▼              ▼
     Job Listings    Skill Matching
           │              │
           └──────┬───────┘
                  ▼
             Match Score
                  │
                  ▼
           Matching Jobs
                  │
                  ▼
             Email Alert
```

---

# 🔐 Important Security Note

Never expose:

* API keys
* SMTP passwords
* Database credentials
* Private environment variables

Use:

```text
.env
```

and keep secrets out of version control.

---

# 🧪 Health Check

You can verify the backend service using:

```http
GET /api/health
```

This can be used to confirm that:

* The API server is running
* The database connection is active

---

# 📌 Future Improvements

Potential improvements for future versions:

* User authentication and authorization
* Multiple resume profiles
* More ATS job sources
* Advanced semantic job matching
* Job bookmarking
* Application tracking dashboard
* Interview preparation suggestions
* Personalized skill-gap recommendations
* Real-time notifications
* Deployment to cloud infrastructure

---

# 👨‍💻 Author

**Sanjay Shende**

Full Stack Developer | MERN Stack Developer | Java & DSA Enthusiast

---

# ⭐ Support

If you found this project useful, consider giving the repository a star.

It helps make the project easier to discover and also documents your work publicly.

---

## 📄 License

This project is intended for educational and portfolio purposes.
