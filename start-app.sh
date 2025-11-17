#!/bin/bash

# Simple script to run backend and frontend concurrently

echo "--- Starting FastAPI Backend (in background) ---"
# Navigate to backend and start FastAPI via uvicorn. The '&' runs it in the background.
cd backend
python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload &
cd .. # Go back to the root directory

echo "Backend is starting... waiting a few seconds."
sleep 5 # Wait 5 seconds to let the backend initialize

echo "--- Starting Frontend Server (in foreground) ---"
# Navigate to frontend and start it. This will take over the terminal.
cd frontend
npm start --legacy-peer-deps

echo "Script finished."