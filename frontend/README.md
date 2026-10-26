# AI Research Paper Summarizer

## Project Description

A modern, premium‑looking frontend for an AI‑powered web application that summarizes research papers. The UI is inspired by ChatGPT, Notion AI, and Perplexity, featuring a clean, minimalistic design with glass‑morphism effects and responsive layouts.

## Frontend Technologies
- HTML5
- CSS3 (custom design system, responsive, glass‑morphism)
- JavaScript (ES6 modules)
- Google Fonts – **Poppins**

## Folder Structure
```
AI-Research-Paper-Summarizer/
├── index.html
├── login.html
├── register.html
├── dashboard.html
├── upload.html
├── processing.html
├── summary.html
├── papers.html
├── profile.html
│
├── assets/
│   ├── css/
│   │   ├── style.css
│   │   ├── dashboard.css
│   │   ├── upload.css
│   │   ├── summary.css
│   │   ├── profile.css
│   │   └── responsive.css
│   │
│   ├── js/
│   │   ├── main.js
│   │   ├── dashboard.js
│   │   ├── upload.js
│   │   └── summary.js
│   │
│   ├── images/   (placeholder)
│   ├── icons/    (placeholder)
│   └── fonts/    (placeholder)
│
└── README.md
```

## How to Run the Project
1. Open a terminal and navigate to the project root directory.
2. Launch a simple HTTP server, for example:
   ```bash
   # Using Python 3
   python -m http.server 8000
   ```
3. Open a browser and visit `http://localhost:8000` to see the landing page.

## Future Backend Integration
- API endpoints will be added to handle authentication, file uploads, and summarization.
- The current structure isolates assets and HTML pages, making it straightforward to replace static placeholders with dynamic data.

---
*Prepared for future expansion and production deployment.*
