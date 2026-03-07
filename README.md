# StayOnTrack

## Project Overview

StayOnTrack is an AI-driven educational tool that analyzes student data (attendance, grades, assignments, class participation, and other metrics) to predict academic risk levels. It empowers mentors, teachers, and admins to stage targeted interventions and improve overall outcomes.

## Architecture

- **Frontend:** React, Tailwind CSS, Vite
- **Backend:** Node.js, Express, MongoDB
- **ML Service:** Python, Scikit-learn (Risk recalculation)
- **Deployment:** Render (Backend/ML) + Vercel/Render (Frontend)

## Installation

### 1. Prerequisites

- Node.js (v18+)
- Python 3.8+ (for ML microservice)
- MongoDB Database (Local or MongoDB Atlas)

### 2. Clone the Repository

```bash
git clone https://github.com/your-username/student-risk-predictor.git
cd student-risk-predictor
```

### 3. Backend Setup

```bash
cd server
npm install
```

### 4. Frontend Setup

```bash
cd ../client
npm install
```

## Environment Setup

Create the required `.env` files based on `.env.example`.

**server/.env**

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
ML_SERVICE_URL=url_to_ml_health_or_predict_endpoint
```

**client/.env**

```env
VITE_API_BASE_URL=http://localhost:5000
```

## Running the Project

1. **Start Backend (from `/server`):**

```bash
npm run dev
```

2. **Start Frontend (from `/client`):**

```bash
npm run dev
```

## Build Process

To generate a production build for the frontend:

```bash
cd client
npm run build
```

## API Documentation

- `GET /health` - Health ping endpoint
- `POST /api/auth/login` - User authentication
- `GET /api/students` - Retrieve all students
- `GET /api/alerts` - Retrieve current risk alerts
- `POST /api/admin/risk-recalculate` - Trigger batch ML risk calculation

## Deployment Guide

This project is configured natively for Render deployment via `render.yaml`. Connect your GitHub repository to Render and use the Blueprint instance. Ensure all environment variables are populated securely through your cloud provider's dashboard.
