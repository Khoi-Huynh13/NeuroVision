# NeuroVision
**Explainable AI Imaging for Brain Tumour Detection and Segmentation**

UTS 42028 Deep Learning and Convolutional Neural Networks | Autumn 2026 | Project 80

**Team:** Piya Jolly (24505137), Patrick Thet Htoo Zaw (24920819), Khoi Huynh (24902037)  
---

## Overview
NeuroVision is an end-to-end brain tumour analysis system that classifies MRI scans into four classes (Glioma, Meningioma, Pituitary, No Tumor), generates Grad-CAM explainability heatmaps, and produces U-Net segmentation masks. All delivered through a React web interface backed by a FastAPI inference server.

---

## Repository Structure

```text
NeuroVision/
├── Backend/
│   ├── main.py
│   └── Requirements.txt
├── archive/
│   ├── custom_cnn_best.pth
│   ├── custom_cnn_confusion_matrix.png
│   ├── custom_cnn_roc_curves.png
│   ├── custom_cnn_training_curves.png
│   ├── efficientnetB0_weights.txt
│   └── Preprocessing.ipynb
├── classification/
│   ├── custom_cnn.ipynb
│   ├── EfficientNet-B0.ipynb
│   └── ResNet50.ipynb
├── explainability/
│   ├── gradcam.ipynb
│   ├── gradcam_glioma.png
│   ├── gradcam_meningioma.png
│   ├── gradcam_no_tumor.png
│   ├── gradcam_pituitary.png
│   └── gradcam_sample_glioma.png
├── gui/
│   └── src/
│       ├── App.css
│       ├── App.jsx
│       ├── Aurora.css
│       ├── Aurora.jsx
│       ├── BorderGlow.css
│       ├── BorderGlow.jsx
│       ├── NeuroVisionApp.jsx
│       ├── index.css
│       └── main.jsx
├── segmentation/
│   ├── Unet.ipynb
│   ├── README.md
│   └── model.safetensors
├── .gitignore
├── README.md
├── STARTUP_GUIDE.md
├── best_weights.pth
├── Dataset.txt
└── split_indices.json
```

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
- **Dataset 1:** [Sartaj Brain Tumour MRI](https://www.kaggle.com/datasets/sartajbhuvaji/brain-tumor-classification-mri): 3,264 images, 4 classes
- **Dataset 2:** [Darabi Brain Tumour Segmentation](https://www.kaggle.com/datasets/masoudnickparvar/brain-tumor-mri-dataset): 2,146 images, COCO polygon masks

---

## System Architecture
- **Classifier:** EfficientNet-B0 (transfer learning, ImageNet pretrained)
- **Explainability:** Grad-CAM (Selvaraju et al. 2017): runs at every inference
- **Segmentation:** U-Net with EfficientNet-B0 encoder
- **Backend:** FastAPI on AWS SageMaker GPU (NVIDIA T4)
- **Frontend:** React + Vite

---

## How to Run
See [STARTUP_GUIDE.md](STARTUP_GUIDE.md) for full setup instructions.

**Quick start:**
```bash
# SageMaker Terminal 1: start backend
pip install segmentation-models-pytorch --break-system-packages
cd Backend
uvicorn main:app --host 0.0.0.0 --port 8000

# SageMaker Terminal 2: expose via ngrok
python3 -c "from pyngrok import ngrok; t = ngrok.connect(8000); print(t.public_url)"

# Local: run GUI
cd gui && npm run dev
```
