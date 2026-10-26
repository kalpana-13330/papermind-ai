# PaperMind AI 🧠📄

**PaperMind AI** is an intelligent research paper summarizer and academic study assistant powered by Google Gemini AI, Express.js, and a modern glassmorphic web interface.

---

## 🏗️ Architecture Overview

The repository is structured into two main components:
- **`backend/`**: Node.js & Express REST API with MongoDB (Mongoose), Google Gemini AI (`@google/genai`), JWT authentication, Supabase Storage for PDF files, and PDFKit.
- **`frontend/`**: Modern, responsive vanilla HTML5, CSS3 (glassmorphism design system), and JavaScript client with dark mode and real-time paper chat & analysis.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18+ recommended, detected v22)
- **npm** (v9+)
- **Python 3** (or any static HTTP server for the frontend)
- **MongoDB** (Local instance, Docker, or [MongoDB Atlas](https://www.mongodb.com/atlas) cloud URI)

---

### 2. Backend Setup

All dependencies have already been installed in `backend/node_modules`.

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Configure environment variables in `backend/.env` (already generated from `.env.example`):
   ```env
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173,http://localhost:3000
   MONGODB_URI=mongodb://127.0.0.1:27017/ai_paper_summarizer
   JWT_SECRET=your_secret_key_here
   AI_API_KEY=your_gemini_api_key_here
   ```
   *(Add your Gemini API Key in `AI_API_KEY` for summarization features)*

3. Run backend tests:
   ```bash
   npm test
   # Or run specific test:
   node test/health.test.js
   ```

4. Start the backend development server:
   ```bash
   npm run dev
   # Or:
   npm start
   ```
   The API will be live at `http://localhost:5000`. Health check: `http://localhost:5000/api/health`.

---

### 3. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Start the local static development server:
   ```bash
   # Using Python 3:
   python -m http.server 5173
   ```
   *(Or run `npm start` / `npm run dev` in the frontend directory)*

3. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

## 🗄️ Database Options

If you need a local MongoDB instance running quickly:
- **Using Docker**:
  ```bash
  docker run -d -p 27017:27017 --name mongodb mongo:latest
  ```
- **Using MongoDB Atlas**:
  Create a free cluster on [cloud.mongodb.com](https://cloud.mongodb.com) and paste your connection string into `backend/.env`:
  ```env
  MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/ai_paper_summarizer
  ```
  *(The backend includes built-in DNS-over-HTTPS fallback to ensure reliable connection even behind restrictive local DNS).*