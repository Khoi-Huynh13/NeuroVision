# NeuroVision
**Explainable AI Imaging for Brain Tumour Detection and Segmentation**

UTS 42028 Deep Learning and Convolutional Neural Networks | Autumn 2026 | Project 80

**Team:** Piya Jolly (24505137) · Patrick Thet Htoo Zaw (24920819) · Khoi Huynh (24902037)  
---

## Overview
NeuroVision is an end-to-end brain tumour analysis system that classifies MRI scans into four classes (Glioma, Meningioma, Pituitary, No Tumor), generates Grad-CAM explainability heatmaps, and produces U-Net segmentation masks — all delivered through a React web interface backed by a FastAPI inference server.

---

## Repository Structure
NeuroVision/
├── Backend/
│   ├── main.py              # FastAPI inference server
│   └── Requirements.txt     # Python dependencies
├── classification/
│   ├── custom_cnn.ipynb     # Custom CNN (Piya)
│   ├── ResNet50.ipynb       # ResNet50 (Patrick)
│   └── EfficientNet-B0.ipynb # EfficientNet-B0 (Khoi)
├── explainability/
│   └── gradcam.ipynb        # Grad-CAM implementation
├── segmentation/
│   ├── Unet.ipynb           # U-Net training
│   └── model.safetensors    # Trained U-Net weights
├── gui/
│   └── src/
│       └── NeuroVisionApp.jsx # React frontend
├── best_weights.pth         # EfficientNet-B0 classifier weights
├── split_indices.json       # Shared train/val/test split
└── STARTUP_GUIDE.md         # How to run the system

---

## Model Results

| Model | Test Accuracy | Weighted F1 | ROC-AUC |
|---|---|---|---|
| Custom CNN | 87.0% | 0.8643 | 0.9711 |
| ResNet50 | 92.65% | 0.9263 | 0.9906 |
| **EfficientNet-B0** | **96.94%** | **0.9693** | **1.000** |

**Segmentation (U-Net):** Validation IoU 0.728 · Dice ≈ 0.842

---

## Datasets
- **Dataset 1:** [Sartaj Brain Tumour MRI](https://www.kaggle.com/datasets/sartajbhuvaji/brain-tumor-classification-mri) — 3,264 images, 4 classes
- **Dataset 2:** [Darabi Brain Tumour Segmentation](https://www.kaggle.com/datasets/masoudnickparvar/brain-tumor-mri-dataset) — 2,146 images, COCO polygon masks

---

## System Architecture
- **Classifier:** EfficientNet-B0 (transfer learning, ImageNet pretrained)
- **Explainability:** Grad-CAM (Selvaraju et al. 2017) — runs at every inference
- **Segmentation:** U-Net with EfficientNet-B0 encoder
- **Backend:** FastAPI on AWS SageMaker GPU (NVIDIA T4)
- **Frontend:** React + Vite

---

## How to Run
See [STARTUP_GUIDE.md](STARTUP_GUIDE.md) for full setup instructions.

**Quick start:**
```bash
# SageMaker Terminal 1 — start backend
pip install segmentation-models-pytorch --break-system-packages
cd Backend
uvicorn main:app --host 0.0.0.0 --port 8000

# SageMaker Terminal 2 — expose via ngrok
python3 -c "from pyngrok import ngrok; t = ngrok.connect(8000); print(t.public_url)"

# Local — run GUI
cd gui && npm run dev
```
