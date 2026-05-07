# Vietnamese Tuong Mask Gallery (Mặt Nạ Tuồng Việt Nam)

A digital exhibition web application built to showcase a collection of 115 traditional Tuong masks from Vietnam. The project is designed with a high-end, minimalist aesthetic, focusing on clean typography, accessible interactions, and smooth animations to provide a museum-like experience.

## 🎭 Project Overview
- **Objective:** Preserve and digitally exhibit the art of Vietnamese Tuong masks.
- **Design Philosophy:** Minimalist, structured, and dark-mode by default.
## 🏗 Architecture & Tech Stack

This project is a monorepo containing both the frontend application and the backend API.

### 1. Frontend (`/frontend`)
- **Framework:** React.js initialized with Vite
- **Styling:** Tailwind CSS v4 (using `@theme` for strict token-driven design)
- **Animations:** Framer Motion
- **Icons:** `lucide-react`

### 2. Backend (`/backend`)
- **Framework:** Python 3 with FastAPI
- **Database:** SQLite3 (`masks.db`)
- **Server:** Uvicorn
- **Storage:** Serves static images from `/static/images`

---

## 🚀 How to Run Locally

### Step 1: Start the Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Initialize the database (this creates `masks.db` and populates 117 mask entries):
   ```bash
   python init_db.py
   ```
4. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *The API will be available at `http://localhost:8000/api/masks`.*

### Step 2: Start the Frontend
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`.



