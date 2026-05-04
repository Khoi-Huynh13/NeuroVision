# =============================================================================
#  NeuroVision — FastAPI Inference Backend
#  File: backend/main.py
#
#  Sections:
#   1. Imports & config
#   2. Model loading (runs once at startup)
#   3. Helper functions (preprocessing, Grad-CAM, encoding)
#   4. POST /predict endpoint
#   5. GET /health endpoint (for testing the server is alive)
# =============================================================================


# ── 1. IMPORTS & CONFIG ───────────────────────────────────────────────────────

import io
import base64
import numpy as np
import torch
import torch.nn.functional as F
import segmentation_models_pytorch as smp
import matplotlib
matplotlib.use("Agg")   # non-interactive backend — must be set before pyplot import
import matplotlib.pyplot as plt
import matplotlib.cm as cm

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from torchvision import transforms, models


# ── Paths ──
CLASSIFIER_WEIGHTS_PATH = "/home/sagemaker-user/NeuroVision/best_weights.pth"
UNET_WEIGHTS_PATH       = "/home/sagemaker-user/NeuroVision/segmentation"

# ── Class names must match the order used during classifier training ──
CLASS_NAMES = ["Glioma", "Meningioma", "No Tumor", "Pituitary"]

# ── Confidence threshold — predictions below this are flagged as low confidence ──
CONFIDENCE_THRESHOLD = 0.60

# ── Device ──
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"[startup] Running on device: {DEVICE}")


# ── 2. MODEL LOADING (runs once at startup) ───────────────────────────────────

# EfficientNet-B0 classifier
# Handles both saving styles:
#   torch.save(model.state_dict(), path)  → loads as state_dict (OrderedDict)
#   torch.save(model, path)               → loads as full model object
def load_classifier() -> torch.nn.Module:
    checkpoint = torch.load(CLASSIFIER_WEIGHTS_PATH, map_location=DEVICE)

    if isinstance(checkpoint, torch.nn.Module):
        # Full model was saved — use directly
        model = checkpoint
    else:
        # State dict was saved — rebuild architecture first then load weights
        model = models.efficientnet_b0(weights=None)
        in_features = model.classifier[1].in_features
        model.classifier[1] = torch.nn.Linear(in_features, len(CLASS_NAMES))
        model.load_state_dict(checkpoint)

    model.to(DEVICE)
    model.eval()
    print("[startup] Classifier loaded OK")
    return model


# U-Net segmentation model
def load_unet() -> torch.nn.Module:
    model = smp.from_pretrained(UNET_WEIGHTS_PATH)
    model.to(DEVICE)
    model.eval()
    print("[startup] U-Net loaded OK")
    return model


# Load both models at module import time — they stay in memory for all requests
classifier = load_classifier()
unet       = load_unet()


# ── 3. HELPER FUNCTIONS ───────────────────────────────────────────────────────

# --- 3a. Image preprocessing ---

# Classifier preprocessing — ImageNet normalisation, 224×224
CLASSIFIER_TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

# U-Net preprocessing — matches Khoi's get_preprocessing_fn('efficientnet-b0')
# Same ImageNet stats but returns numpy array (smp convention)
UNET_MEAN = np.array([0.485, 0.456, 0.406])
UNET_STD  = np.array([0.229, 0.224, 0.225])

def preprocess_for_unet(pil_image: Image.Image) -> torch.Tensor:
    """Resize, normalise with ImageNet stats, convert to CHW float tensor."""
    img = pil_image.resize((224, 224))
    img = np.array(img).astype(np.float32) / 255.0
    img = (img - UNET_MEAN) / UNET_STD
    img = torch.from_numpy(img).permute(2, 0, 1).unsqueeze(0).float()
    return img.to(DEVICE)


# --- 3b. Grad-CAM ---

# We hook the last convolutional layer of EfficientNet-B0.
# EfficientNet's last conv block sits at: model.features[-1]
# Grad-CAM works by:
#   1. Doing a forward pass and recording the feature map activations
#   2. Doing a backward pass from the predicted class score
#   3. Averaging the gradients across spatial dims → per-channel weights
#   4. Weighting the feature maps by those weights and ReLU-ing the result
#   5. Upsampling back to 224×224

class GradCAM:
    def __init__(self, model: torch.nn.Module):
        self.model      = model
        self.gradients  = None
        self.activations = None
        # Hook the last conv block
        target_layer = model.features[-1]
        target_layer.register_forward_hook(self._save_activations)
        target_layer.register_full_backward_hook(self._save_gradients)

    def _save_activations(self, module, input, output):
        self.activations = output.detach()

    def _save_gradients(self, module, grad_input, grad_output):
        self.gradients = grad_output[0].detach()

    def generate(self, input_tensor: torch.Tensor, class_idx: int) -> np.ndarray:
        """Returns a 224×224 float numpy array (values 0–1)."""
        self.model.zero_grad()
        output = self.model(input_tensor)            # forward pass
        score  = output[0, class_idx]                # score for predicted class
        score.backward()                             # backward pass

        # Pool gradients across spatial dims → (C,)
        weights = self.gradients.mean(dim=[2, 3])    # (1, C)

        # Weight the activation maps
        cam = (weights[0, :, None, None] * self.activations[0]).sum(dim=0)
        cam = F.relu(cam)

        # Normalise to 0–1
        cam -= cam.min()
        if cam.max() > 0:
            cam /= cam.max()

        # Upsample to 224×224
        cam = F.interpolate(
            cam.unsqueeze(0).unsqueeze(0),
            size=(224, 224),
            mode="bilinear",
            align_corners=False
        ).squeeze().cpu().numpy()

        return cam


# Instantiate once — the hooks persist across requests
grad_cam = GradCAM(classifier)


# --- 3c. Encoding helpers ---

def heatmap_to_base64(cam: np.ndarray, original_pil: Image.Image) -> str:
    """Overlay Grad-CAM heatmap on the original image, return base64 PNG."""
    # Resize original to 224×224 for overlay
    orig = np.array(original_pil.resize((224, 224))).astype(np.float32) / 255.0

    # Apply colormap to CAM
    colormap  = cm.jet(cam)[:, :, :3]   # (224, 224, 3) — drop alpha

    # Blend
    overlay = 0.55 * orig + 0.45 * colormap
    overlay = np.clip(overlay, 0, 1)

    # Encode to PNG → base64
    fig, ax = plt.subplots(figsize=(2.24, 2.24), dpi=100)
    ax.imshow(overlay)
    ax.axis("off")
    buf = io.BytesIO()
    plt.savefig(buf, format="png", bbox_inches="tight", pad_inches=0)
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode("utf-8")


def mask_to_base64(mask: np.ndarray, original_pil: Image.Image) -> str:
    """Overlay binary segmentation mask (green) on the original image, return base64 PNG."""
    orig = np.array(original_pil.resize((224, 224))).astype(np.float32) / 255.0

    # Green overlay where mask == 1
    overlay = orig.copy()
    overlay[mask == 1, 0] *= 0.5   # dampen red
    overlay[mask == 1, 1]  = np.clip(overlay[mask == 1, 1] * 0.5 + 0.5, 0, 1)  # boost green
    overlay[mask == 1, 2] *= 0.5   # dampen blue

    fig, ax = plt.subplots(figsize=(2.24, 2.24), dpi=100)
    ax.imshow(overlay)
    ax.axis("off")
    buf = io.BytesIO()
    plt.savefig(buf, format="png", bbox_inches="tight", pad_inches=0)
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode("utf-8")


# ── 4. FASTAPI APP + /predict ENDPOINT ───────────────────────────────────────

app = FastAPI(title="NeuroVision API")

# Allow requests from the React GUI (any origin during dev — lock this down in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


@app.post("/predict")
async def predict(image: UploadFile = File(...)):
    # ── Validate file type ──
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    # ── Read and decode image ──
    raw_bytes = await image.read()
    try:
        pil_image = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Could not decode image file.")

    # ── Preprocess for classifier ──
    input_tensor = CLASSIFIER_TRANSFORM(pil_image).unsqueeze(0).to(DEVICE)

    # ── Step 1: Classification ──
    with torch.enable_grad():   # Grad-CAM needs gradients
        logits = classifier(input_tensor)

    probs      = F.softmax(logits, dim=1).squeeze()
    confidence = float(probs.max().item())
    class_idx  = int(probs.argmax().item())
    label      = CLASS_NAMES[class_idx]

    probabilities = {
        CLASS_NAMES[i]: round(float(probs[i].item()), 4)
        for i in range(len(CLASS_NAMES))
    }

    low_confidence = confidence < CONFIDENCE_THRESHOLD

    # ── Step 2: Grad-CAM (always runs, regardless of prediction) ──
    cam           = grad_cam.generate(input_tensor, class_idx)
    gradcam_b64   = heatmap_to_base64(cam, pil_image)

    # ── Step 3: Segmentation (only if tumor detected and confidence is sufficient) ──
    seg_mask_b64 = None

    if label != "No Tumor" and not low_confidence:
        unet_input = preprocess_for_unet(pil_image)
        with torch.no_grad():
            logits_mask  = unet(unet_input)
            prob_mask    = torch.sigmoid(logits_mask)
            binary_mask  = (prob_mask > 0.5).float().squeeze().cpu().numpy()
        seg_mask_b64 = mask_to_base64(binary_mask, pil_image)

    # ── Return JSON response ──
    return {
        "label":          label,
        "confidence":     round(confidence, 4),
        "probabilities":  probabilities,
        "low_confidence": low_confidence,
        "gradcam_b64":    gradcam_b64,
        "seg_mask_b64":   seg_mask_b64,    # null if No Tumor or low confidence
    }


# ── 5. HEALTH CHECK ───────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status":  "ok",
        "device":  str(DEVICE),
        "classes": CLASS_NAMES,
    }