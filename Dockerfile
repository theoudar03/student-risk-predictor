FROM nikolaik/python-nodejs:python3.11-nodejs18

WORKDIR /app

# 1. Install System Dependencies
RUN apt-get update && apt-get install -y build-essential

# 2. Install Node Dependencies (Caching layer)
COPY server/package*.json ./
RUN npm install

# 3. Install Python Dependencies (Caching layer)
COPY server/python_ml/requirements.txt ./python_ml/
RUN pip install --no-cache-dir -r python_ml/requirements.txt

# 4. Copy Application Code
# We copy the contents of the 'server' directory into /app
COPY server/ .

# 5. Train Model (Ensure pkl file exists)
WORKDIR /app/python_ml
RUN python retrain_model.py

# 6. Return to App Root
WORKDIR /app

# 7. Expose Node.js Port
EXPOSE 5000

# 8. Start both services
# Node runs on 5000, Python ML on 8001 (internal)
CMD bash -c "cd python_ml && uvicorn ml_api:app --host 127.0.0.1 --port 8001 & npm start"
