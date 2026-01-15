FROM nikolaik/python-nodejs:python3.11-nodejs18

WORKDIR /app

# 1. Install System Dependencies
RUN apt-get update && apt-get install -y build-essential

# 2. Install Python Dependencies
COPY python_ml/requirements.txt ./python_ml/
RUN pip install --no-cache-dir -r python_ml/requirements.txt

# 2. Install Node Dependencies
COPY package*.json ./
RUN npm install

# 3. Copy Application Code
COPY . .

# 4. Train Model (Ensure it exists)
WORKDIR /app/python_ml
RUN python retrain_model.py
WORKDIR /app

# 5. Build/Prep (if needed)

# Expose Node.js Port
# Expose Node.js Port
EXPOSE 5000

# 6. Start both services
# We use a shell command to start uvicorn in background and then node
CMD bash -c "cd python_ml && uvicorn ml_api:app --host 127.0.0.1 --port 8001 & npm start"
