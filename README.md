# 🤖 Job Hunter Agent — Autonomous AI Job Hunter & Resume Matching System

An enterprise-grade, autonomous multi-container microservice system that continuously parses candidate resumes using Google Gemini AI, aggregates real-time tech job opportunities across multiple providers, scores matches with weighted ATS compatibility algorithms, and delivers automated email digests via background cron daemons.

---

## 🏗 Microservices Architecture

```
                                  [ Client Browser ]
                                          │
                                   (Port 80: HTTP)
                                          ▼
                      ┌────────────────────────────────────────┐
                      │            client Container            │
                      │       (Alpine Nginx Reverse Proxy)     │
                      │   - Serves React + Vite + Tailwind SPA │
                      │   - Proxies /api/* to api-server:5000  │
                      └───────────────────┬────────────────────┘
                                          │
                                 (/api/* Proxy Traffic)
                                          ▼
                      ┌────────────────────────────────────────┐
                      │          api-server Container          │
                      │          (Node.js 20 Express)          │
                      │   - Multer Memory Storage (.pdf/.docx) │
                      │   - pdf-parse & mammoth text engine    │
                      │   - Gemini 2.5 Flash ATS Extraction    │
                      │   - Real-time Match Calculation API    │
                      └───────────┬────────────────┬───────────┘
                                  │                │
                        (Reads / Writes)      (Network Call)
                                  │                │
                                  ▼                ▼
                     ┌──────────────────┐  ┌──────────────────────┐
                     │ mongo Container  │  │ Google Gemini AI API │
                     │   (MongoDB 7.0)  │  └──────────────────────┘
                     └─────────▲────────┘
                               │
                        (Reads / Writes)
                               │
                      ┌────────┴───────────────────────────────┐
                      │          cron-worker Container         │
                      │        (Node.js 20 Background)         │
                      │   - Scheduled node-cron daemon         │
                      │   - RapidAPI JSearch / Adzuna Fetch    │
                      │   - Keyword Overlap & Skill Matcher    │
                      │   - Nodemailer HTML Digest Dispatcher  │
                      └───────────────────┬────────────────────┘
                                          │
                                    (SMTP Alert)
                                          ▼
                                 [ Candidate Inbox ]
```

---

## 📁 Repository Structure

```
job-hunter-agent/
├── docker-compose.yml          # Multi-container orchestration (client, api-server, cron-worker, mongo)
├── .env.example                # Canonical environment variable specifications
├── .gitignore                  # Git exclusions
├── README.md                   # System documentation & architectural runbook
├── client/
│   ├── Dockerfile              # Multi-stage build (Node 20 Alpine -> Nginx Alpine)
│   ├── nginx.conf              # Production Nginx reverse proxy & SPA router
│   ├── package.json            # React 18, Vite, Tailwind CSS, Lucide icons
│   ├── vite.config.js          # Vite configuration with /api development proxy
│   ├── tailwind.config.js      # Tailored modern dark palette
│   ├── postcss.config.js       # PostCSS plugins
│   ├── index.html              # HTML5 entrypoint with Google Fonts
│   └── src/
│       ├── App.jsx             # Main dashboard, tab navigation & toast notifications
│       ├── main.jsx            # React root mount
│       ├── index.css           # Glassmorphism utilities & base styles
│       ├── components/
│       │   ├── ResumeUpload.jsx       # Drag & drop upload zone (.pdf, .docx) with progress
│       │   ├── JobCard.jsx            # Job card with score badge & apply trigger
│       │   ├── MatchBadge.jsx         # Color-coded badge (>80% Green, 60-80% Yellow)
│       │   └── AnalyticsDashboard.jsx # Extracted ATS skills & cluster telemetry
│       └── services/
│           └── api.js          # Axios client with upload progress & error handling
└── server/
    ├── Dockerfile              # Production Node 20 Alpine with layer caching
    ├── package.json            # Express, Helmet, Mongoose, Gemini SDK, node-cron, nodemailer
    ├── server.js               # Express API server handling uploads, parsing & matches
    ├── worker.js               # Autonomous background cron worker & alert dispatcher
    ├── config/
    │   └── db.js               # Mongoose connection with automated retries & pooling
    ├── models/
    │   ├── UserProfile.js      # Candidate profile schema with extracted skills & threshold
    │   └── JobListing.js       # Job listing schema with 14-day MongoDB TTL index
    └── services/
        ├── geminiService.js    # Google Gen AI ATS analyzer with fallback parser
        ├── jobAggregationService.js # RapidAPI / Adzuna / curated seed aggregator
        └── emailService.js     # Responsive HTML email digest generator & SMTP sender
```

---

## 🚀 Quick Start (Docker Compose)

### 1. Clone & Configure Environment
```bash
cp .env.example .env
```
Edit `.env` to supply your API credentials:
- `GEMINI_API_KEY`: Your key from [Google AI Studio](https://aistudio.google.com/). *(If omitted, a built-in heuristic ATS fallback runs for zero-friction testing).*
- `RAPIDAPI_KEY` & `RAPIDAPI_HOST`: Optional RapidAPI JSearch credentials.
- `ADZUNA_APP_ID` & `ADZUNA_APP_KEY`: Optional Adzuna credentials.
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`: SMTP credentials for alert emails. *(If omitted, an Ethereal test inbox link is automatically logged).*

### 2. Launch Entire Microservices Cluster
```bash
docker compose up --build -d
```

### 3. Verify Container Health
```bash
docker compose ps
```
All containers will report `healthy` status:
- `client`: Accessible at [http://localhost](http://localhost) (Port 80)
- `api-server`: Accessible at [http://localhost:5000](http://localhost:5000) (Port 5000)
- `cron-worker`: Running background daemon
- `mongo`: Local database at port 27017

---

## 💻 Local Development (Without Docker)

If you prefer to run services natively on your host machine:

### 1. Prerequisites
- Node.js >= 20.x
- MongoDB (Running locally on `mongodb://localhost:27017/jobhunter` or MongoDB Atlas URI)

### 2. Start Backend API Server
```bash
cd server
npm install
npm run dev
```

### 3. Start Background Cron Worker (in a separate terminal)
```bash
cd server
npm run dev:worker
```

### 4. Start Frontend Client (in a separate terminal)
```bash
cd client
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the client app with active API proxy.

---

## 📡 REST API Documentation

### 1. Upload & Parse Resume
- **Endpoint**: `POST /api/resume/upload`
- **Content-Type**: `multipart/form-data`
- **Body**: `resume` (Binary `.pdf` or `.docx`, max 10MB)
- **Response** (HTTP 200):
```json
{
  "success": true,
  "message": "Resume parsed and profile updated successfully.",
  "profile": {
    "_id": "673cf9829...",
    "email": "candidate@example.com",
    "name": "Jane Doe",
    "experienceLevel": "Senior",
    "extractedSkills": ["React", "Node.js", "Docker", "AWS", "Kubernetes"],
    "targetRoles": ["Senior Full Stack Engineer", "Cloud Architect"],
    "preferredLocations": ["Remote", "New York, NY"],
    "matchThreshold": 70,
    "lastJobAlertSent": null
  }
}
```

### 2. Get Job Matches for Candidate
- **Endpoint**: `GET /api/matches/:userId`
- **Params**: `userId` (MongoDB ObjectId or Email address)
- **Response** (HTTP 200):
```json
{
  "success": true,
  "userId": "673cf9829...",
  "matchesCount": 12,
  "matches": [
    {
      "job": {
        "jobId": "seed-job-1",
        "title": "Senior Full Stack Engineer (React / Node / Cloud)",
        "company": "CloudScale Technologies",
        "location": "Remote, US",
        "applyUrl": "https://example.com/apply/senior-fullstack",
        "source": "Curated"
      },
      "matchScore": 94,
      "matchedSkills": ["React", "Node.js", "Docker", "Kubernetes", "AWS"]
    }
  ]
}
```

### 3. Readiness & Healthcheck
- **Endpoint**: `GET /api/health`
- **Response** (HTTP 200):
```json
{
  "status": "ok",
  "uptime": 124.5,
  "dbConnected": true
}
```

---

## 🛡 Security & Zero-Trust Policies (Module 7)

The system adheres to defense-in-depth and zero-trust engineering principles across all layers:

### 1. Docker & OS-Level Hardening
- **Non-Root Execution:** Node processes run strictly under the unprivileged `USER node` (UID 1000). Nginx files are owned by `nginx:nginx` with read-only execution permissions.
- **Linux Capabilities Dropped:** Containers enforce `cap_drop: [ALL]` and `security_opt: [no-new-privileges:true]`.
- **Zero Public Host Ports for API:** The `api-server` container exposes port `5000` only internally to the private bridge `job-network`. All public ingress passes exclusively through the Nginx reverse proxy on port 80.

### 2. File Upload & DoS / RCE Defense
- **Magic Byte File Signature Verification:** Inspects raw file headers (`%PDF-` for PDFs, `PK\x03\x04` for DOCX) to block disguised executable payloads.
- **Strict Size Limitation:** Files are capped at `5MB` using `multer.memoryStorage()`.
- **Sandboxed Parsing with Isolated Timeout:** Wraps `pdf-parse` in an asynchronous execution race with a strict 6-second timeout to prevent Regular Expression DoS (ReDoS) or resource exhaustion.

### 3. API & Middleware Hardening
- **Rate Limiting:** Global rate limiting of 100 requests per 15 minutes per IP; sensitive `/api/resume/upload` endpoint is restricted to 5 requests per 15 minutes per IP to safeguard Gemini AI quota.
- **Strict Content Security Policy (CSP):** Configured via `helmet()` with frameguard clickjacking protection (`frameguard: { action: 'deny' }`) and 1-year HSTS (`maxAge: 31536000`).
- **Strict CORS:** Wildcards (`*`) are disallowed in production; incoming origins must match authorized domain whitelists.
- **NoSQL Injection Prevention:** Sanitization middleware strips MongoDB query operators (`$gt`, `$ne`, `$where`) and key dots from `req.body`, `req.query`, and `req.params`.

### 4. Prompt Injection Defense (Gemini ATS Service)
- **Defensive Boundary Delimiters:** Resume raw text is isolated within explicit demarcation boundaries: `"""UNTRUSTED_RESUME_TEXT_START""" ... """UNTRUSTED_RESUME_TEXT_END"""`.
- **System Directives:** Instructs Gemini to treat user text strictly as raw data and ignore all embedded prompt overrides, instructions, or role alterations.
- **Secret Redaction:** Connection strings and API tokens are masked in server logs to prevent credential leakage.
#   J o b _ H u n t e r _ 2 k 2 6  
 