---
description: How to deploy the Student Risk Predictor to production
---

# Deployment Guide

This guide explains how to deploy the Student Risk Predictor project using **Vercel** for the frontend (Client) and **Render** for the backend (Server).

## Prerequisites

- A GitHub account with this repository pushed to it.
- A [Vercel](https://vercel.com) account.
- A [Render](https://render.com) account.

---

## Part 1: Deploy the Backend (Render)

We will deploy the backend first to get the API URL.

1. **Log in to Render** and click **New +** -> **Web Service**.
2. **Connect your GitHub repository**.
3. Configure the service:
   - **Name**: `student-risk-api` (or similar)
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Region**: Choose one close to you (e.g., Singapore/South India if available, or Europe).
4. Click **Create Web Service**.
5. Wait for the deployment to finish. You will see a URL like `https://student-risk-api.onrender.com`.  
   **Copy this URL**.

> **⚠️ Important Check:**  
> Since the project uses local JSON files for data storage (`server/data/*.json`), **data will be reset** every time you redeploy or if the server restarts (which happens daily on free tiers).
> For permanent data storage, you would need to integrate MongoDB.

---

## Part 2: Deploy the Frontend (Vercel)

Now we deploy the React client and connect it to the backend.

1. **Log in to Vercel** and click **Add New...** -> **Project**.
2. **Import your GitHub repository**.
3. Configure the project:
   - **Framework Preset**: Vite (should be detected automatically).
   - **Root Directory**: Click the `Edit` button and select the `client` folder.
4. **Environment Variables**:
   - Expand the "Environment Variables" section.
   - Key: `VITE_API_URL`
   - Value: The Render URL you copied earlier (e.g., `https://student-risk-api.onrender.com`).  
     _(Do not include a trailing slash `/`)_.
5. Click **Deploy**.

---

## Part 3: Verification

1. Once Vercel finishes, click the domain provided (e.g., `student-risk-client.vercel.app`).
2. Open the browser console (F12) to check for any connection errors.
3. Try adding a student or viewing the list. If it works, your full stack app is live!

---

## Troubleshooting

- **CORS Errors**: If you see CORS errors in the browser console, check the Backend logs in Render. Ensure the `VITE_API_URL` matches exactly the backend URL.
- **502 Bad Gateway**: Check Render logs to ensure the server started correctly.
- **Data missing**: As noted, file-based storage resets on restart. This is normal for this architecture on serverless platforms.
