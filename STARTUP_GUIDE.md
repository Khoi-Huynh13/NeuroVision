# NeuroVision Startup & Deployment Guide

**Project:** NeuroVision | UTS 42028 Deep Learning | Autumn 2026
**Team:** Piya Jolly, Patrick Thet Htoo Zaw, Khoi Huynh
**Stack:** FastAPI (SageMaker GPU) + React/Vite (local) + ngrok (tunnel)

## Overview

Every session requires three things to be running simultaneously:

| What | Where | Purpose |
|---|---|---|
| FastAPI server | SageMaker terminal | Runs the models, handles /predict requests |
| ngrok tunnel | SageMaker terminal | Exposes the server to the internet |
| Vite dev server | Local machine (PowerShell) | Serves the React GUI in the browser |

## Step 1: Start the SageMaker Instance

1. Go to [https://studio.sagemaker.aws](https://studio.sagemaker.aws)
2. Open your SageMaker Studio domain
3. Start the instance if it is not already running
4. Open JupyterLab and open a terminal (File → New → Terminal)

## Step 2: Install Dependencies

SageMaker does not persist pip installs between sessions. Run this every time
before starting the server:

```bash
pip install segmentation-models-pytorch pyngrok --break-system-packages
```

This takes about 30 seconds. You only need to run it once per session.

## Step 3: Start the FastAPI Server (Terminal 1)

```bash
cd /home/sagemaker-user/NeuroVision/Backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

Wait until you see all three of these lines before moving on:

```
[startup] Running on device: cuda
[startup] Classifier loaded OK
[startup] U-Net loaded OK
INFO: Uvicorn running on http://0.0.0.0:8000
```

If you see an error saying "address already in use", run:

```bash
pkill -f "uvicorn main:app"
uvicorn main:app --host 0.0.0.0 --port 8000
```

Leave this terminal running. Do not close it.

## Step 4: Start the ngrok Tunnel (Terminal 2)

Open a second terminal tab in SageMaker and run:

```bash
python3 -c "
from pyngrok import ngrok
t = ngrok.connect(8000)
print('BACKEND URL:', t.public_url)
import time; time.sleep(99999)
"
```

It will print a URL like:

```
BACKEND URL: https://xxxx-xxxx.ngrok-free.dev
```

Copy this URL. You will need it in the next step.

Leave this terminal running. Do not close it. If you close it, the tunnel dies
and the GUI will stop being able to reach the backend.

**Important:** ngrok gives a different URL every session. You must update the
URL in NeuroVisionApp.jsx each time (see Step 5).

## Step 5: Update the Backend URL in the GUI

Open this file on your local machine:

```
C:\Users\piyaj\NeuroVision\gui\src\NeuroVisionApp.jsx
```

Find the fetch line inside the runInference function (near the top of the file):

```javascript
const res = await fetch("https://xxxx-xxxx.ngrok-free.dev/predict", { method:"POST", body:fd });
```

Replace the URL with the new ngrok URL from Step 4. Save the file.

## Step 6: Start the GUI (Local PowerShell)

Open PowerShell on your laptop and run:

```powershell
cd C:\Users\piyaj\NeuroVision\gui
npm run dev
```

You should see:

```
VITE v8.x.x  ready in xxxms
➜  Local:   http://localhost:5173/
```

## Step 7: Open the GUI in Your Browser

Go to:

```
http://localhost:5173
```

Before uploading a scan, verify the backend is reachable by opening this URL
in a separate tab:

```
https://xxxx-xxxx.ngrok-free.dev/health
```

You should see a JSON response like:

```json
{
  "status": "ok",
  "device": "cuda",
  "classes": ["Glioma", "Meningioma", "No Tumor", "Pituitary"]
}
```

If the health check returns ok, the system is fully live. Upload a scan and
click Process Image.

---

## Troubleshooting

**"Inference failed: check your backend endpoint"**
The ngrok tunnel has died. Go back to Terminal 2 in SageMaker, rerun the
ngrok command, copy the new URL, update NeuroVisionApp.jsx, and save.

**"ModuleNotFoundError: No module named segmentation_models_pytorch"**
Run Step 2 again. SageMaker does not persist pip installs between sessions.

**"Address already in use" on port 8000**
A previous uvicorn process is still running. Kill it first:
```bash
pkill -f "uvicorn main:app"
```

**"ModuleNotFoundError: No module named pyngrok"**
Run Step 2 again.

**GUI shows mock results (Glioma 92%) instead of real results**
The NeuroVisionApp.jsx on your local machine has the old mock data. Make sure
you have pulled the latest version from GitHub:
```powershell
cd C:\Users\piyaj\NeuroVision
git pull origin main
```

**Startup takes a long time loading models**
Normal. EfficientNet-B0 and U-Net both load from disk into GPU memory on
startup. This takes 10-20 seconds. Wait for all three startup lines before
proceeding.

## Shutting Down

1. In the GUI browser tab, you can simply close it
2. In local PowerShell, press Ctrl+C to stop Vite
3. In SageMaker Terminal 2, press Ctrl+C to kill the ngrok tunnel
4. In SageMaker Terminal 1, press Ctrl+C to stop the FastAPI server
5. Stop the SageMaker instance from the AWS console to avoid charges

## File Reference

| File | Location | Purpose |
|---|---|---|
| main.py | SageMaker: /home/sagemaker-user/NeuroVision/Backend/ | FastAPI inference server |
| Requirements.txt | SageMaker: /home/sagemaker-user/NeuroVision/Backend/ | Python dependencies |
| best_weights.pth | SageMaker: /home/sagemaker-user/NeuroVision/ | EfficientNet-B0 classifier weights |
| model.safetensors | SageMaker: /home/sagemaker-user/NeuroVision/segmentation/ | U-Net segmentation weights |
| NeuroVisionApp.jsx | Local: C:\Users\piyaj\NeuroVision\gui\src\ | React frontend (update ngrok URL here) |

## Key URLs

| URL | Purpose |
|---|---|
| http://localhost:5173 | NeuroVision GUI (local) |
| https://xxxx.ngrok-free.dev/health | Backend health check |
| https://xxxx.ngrok-free.dev/predict | Inference endpoint (POST) |
| https://dashboard.ngrok.com | ngrok account and auth token |
| https://github.com/Khoi-Huynh13/NeuroVision | Project repository |
