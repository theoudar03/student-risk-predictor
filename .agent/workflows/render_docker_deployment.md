---
description: How to configure Render to use Docker for the backend
---

Since we added a Python ML service running alongside the Node.js backend, we can no longer use the standard "Node" environment on Render. We must use **Docker** to package both together.

### Step 1: Login to Render

1. Go to [dashboard.render.com](https://dashboard.render.com).
2. Log in with your GitHub account.

### Step 2: Select your Backend Service

1. Click on your existing **Web Service** that runs the backend (e.g., `student-risk-api`).

### Step 3: Change Runtime to Docker

1. Go to the **Settings** tab.
2. Scroll down to the **Runtime** section.
3. You should see an option to switch from **Node** to **Docker**.
   - _Note: If this option is locked or unavailable, you may need to delete this service and create a new one (see Step 4 below). It is often cleaner to create a new one._

### Step 4: (Recommended) Create a New Web Service

If you cannot verify the runtime switch, creating a new service is the safest bet.

1. Click **New +** -> **Web Service**.
2. Connect your GitHub repository (`student-risk-predictor`).
3. Scroll down to **Root Directory** and set it to: `server`
   - _Important: This tells Render to look for the Dockerfile inside result server folder._
4. Under **Runtime**, select **Docker**.
5. Select your plan (Free or paid).
6. Click **Create Web Service**.

### Step 5: Verify Deployment

1. Render will detect the `Dockerfile` inside the `server/` folder.
2. It will start building:
   - Installing Python dependencies.
   - Installing Node dependencies.
   - Training the logical model (`risk_model.pkl`).
3. Once deployed, it will run the command defined in the Dockerfile: `uvicorn ... & npm start`.

### Step 6: Environment Variables

Don't forget to copy your Environment Variables from the old service to the new one!

1. Go to the **Environment** tab.
2. Add:
   - `MONGO_URI`: (Your MongoDB connection string)
   - `JWT_SECRET`: (Your secret)
   - `PORT`: `5005` (Matches the EXPOSE in Dockerfile)
