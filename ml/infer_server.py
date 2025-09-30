import os
import io
import json
import base64
from typing import Optional, Dict, Any

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
import numpy as np
import torch
import torch.nn as nn
from torchvision import transforms

# Optional: Grad-CAM (for explainability)
try:
    from pytorch_grad_cam import GradCAM
    from pytorch_grad_cam.utils.image import show_cam_on_image
    HAS_GRADCAM = True
except Exception:
    HAS_GRADCAM = False

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RUNS = ROOT / 'ml' / 'runs'

PV_EXPORT = RUNS / 'classifier' / 'export'
PV_CKPT = RUNS / 'classifier' / 'best.pth'
PADDY_EXPORT = RUNS / 'classifier_paddy' / 'export'
PADDY_CKPT = RUNS / 'classifier_paddy' / 'best.pth'
SEV_EXPORT = RUNS / 'severity_regression' / 'export' / 'severity_regression.ts.pt'

app = FastAPI(title="AgriAssist Inference API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Preprocessing (match validation transforms used at training time)
IMG_SIZE = 256
VAL_TF = transforms.Compose([
    transforms.Resize(int(IMG_SIZE * 1.15)),
    transforms.CenterCrop(IMG_SIZE),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

classifiers: Dict[str, Dict[str, Any]] = {}


def load_torchscript_classifier(export_dir: Path) -> Optional[torch.jit.ScriptModule]:
    model_path = export_dir / 'model.ts.pt'
    labels_path = export_dir / 'labels.json'
    if not model_path.exists() or not labels_path.exists():
        return None
    model = torch.jit.load(str(model_path), map_location='cpu')
    model.eval()
    with open(labels_path, 'r', encoding='utf-8') as f:
        labels = json.load(f)
    # labels keys are string indices: {"0":"Tomato_Late_blight", ...}
    idx_to_label = {int(k): v for k, v in labels.items()}
    return {"model": model, "labels": idx_to_label}


# Load available classifiers at startup
if PV_EXPORT.exists():
    cl = load_torchscript_classifier(PV_EXPORT)
    if cl:
        classifiers['plantvillage'] = cl

if PADDY_EXPORT.exists():
    cl = load_torchscript_classifier(PADDY_EXPORT)
    if cl:
        classifiers['paddy'] = cl


class ClassifyResponse(BaseModel):
    predictions: list


def read_image_to_pil(data: bytes) -> Image.Image:
    return Image.open(io.BytesIO(data)).convert('RGB')


def tensor_from_image(pil: Image.Image) -> torch.Tensor:
    return VAL_TF(pil).unsqueeze(0)


def softmax_logits(logits: torch.Tensor) -> np.ndarray:
    sm = torch.softmax(logits, dim=1).detach().cpu().numpy()[0]
    return sm


@app.get("/health")
async def health() -> Dict[str, Any]:
    return {
        "status": "ok",
        "classifiers": list(classifiers.keys()),
        "severity": SEV_EXPORT.exists(),
        "gradcam": HAS_GRADCAM,
    }


@app.post("/classify", response_model=ClassifyResponse)
async def classify(
    model_key: str = Form(..., description="plantvillage or paddy"),
    file: UploadFile = File(...),
    topk: int = Form(5)
):
    if model_key not in classifiers:
        raise HTTPException(status_code=400, detail=f"Unknown model_key. Available: {list(classifiers.keys())}")
    data = await file.read()
    pil = read_image_to_pil(data)
    x = tensor_from_image(pil)

    model = classifiers[model_key]['model']
    labels = classifiers[model_key]['labels']

    with torch.no_grad():
        logits = model(x)
    probs = softmax_logits(logits)

    # top-k
    topk = max(1, min(topk, len(probs)))
    idxs = np.argsort(probs)[::-1][:topk]
    preds = []
    for i in idxs:
        preds.append({
            "label": labels.get(int(i), str(i)),
            "confidence": float(probs[i])
        })

    return {"predictions": preds}


# Grad-CAM support using checkpoints (.pth). Rebuild model dynamically.
# Uses the same approach as in training script.

def build_classifier(backbone: str, num_classes: int) -> nn.Module:
    from torchvision import models
    backbone = backbone.lower()
    if backbone == 'mobilenet_v2':
        model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)
        in_features = model.classifier[1].in_features
        model.classifier[1] = nn.Linear(in_features, num_classes)
        return model
    elif backbone.startswith('efficientnet_b'):
        eff = getattr(models, backbone, models.efficientnet_b0)
        weights_enum = getattr(models, f"{backbone}_weights", models.EfficientNet_B0_Weights)
        model = eff(weights=weights_enum.DEFAULT)
        in_features = model.classifier[1].in_features
        model.classifier[1] = nn.Linear(in_features, num_classes)
        return model
    else:
        raise ValueError(f"Unsupported backbone: {backbone}")


def gradcam_from_ckpt(ckpt_path: Path, pil: Image.Image, target_label: Optional[str]) -> str:
    if not HAS_GRADCAM:
        raise HTTPException(status_code=500, detail="Grad-CAM not available on server (pytorch-grad-cam not installed)")
    ckpt = torch.load(str(ckpt_path), map_location='cpu')
    backbone = ckpt['backbone']
    class_to_idx = ckpt['class_to_idx']

    x = tensor_from_image(pil)
    model = build_classifier(backbone, num_classes=len(class_to_idx))
    model.load_state_dict(ckpt['model_state'])
    model.eval()

    # choose last conv layer
    target_layer = None
    if hasattr(model, 'features') and isinstance(model.features, nn.Sequential):
        target_layer = list(model.features.modules())[-1]
    else:
        last_conv = None
        for m in model.modules():
            if isinstance(m, nn.Conv2d):
                last_conv = m
        target_layer = last_conv
    if target_layer is None:
        raise HTTPException(status_code=500, detail="Could not find conv layer for Grad-CAM")

    cam = GradCAM(model=model, target_layers=[target_layer], use_cuda=torch.cuda.is_available())
    grayscale = cam(input_tensor=x, targets=None)[0]

    disp = pil.resize((IMG_SIZE, IMG_SIZE))
    disp_np = np.array(disp).astype(np.float32) / 255.0
    cam_image = show_cam_on_image(disp_np, grayscale, use_rgb=True, image_weight=(1.0 - 0.45))
    out_img = Image.fromarray(cam_image)
    buf = io.BytesIO()
    out_img.save(buf, format='PNG')
    data = base64.b64encode(buf.getvalue()).decode('utf-8')
    return f"data:image/png;base64,{data}"


class GradCAMResponse(BaseModel):
    dataUri: str


@app.post("/gradcam", response_model=GradCAMResponse)
async def gradcam(
    model_key: str = Form(..., description="plantvillage or paddy"),
    file: UploadFile = File(...),
    target_label: Optional[str] = Form(None)
):
    # Pick checkpoint path
    if model_key == 'plantvillage':
        ckpt = PV_CKPT
    elif model_key == 'paddy':
        ckpt = PADDY_CKPT
    else:
        raise HTTPException(status_code=400, detail=f"Unknown model_key. Available: ['plantvillage','paddy']")

    if not ckpt.exists():
        raise HTTPException(status_code=404, detail=f"Checkpoint not found: {ckpt}")

    data = await file.read()
    pil = read_image_to_pil(data)

    uri = gradcam_from_ckpt(ckpt, pil, target_label)
    return {"dataUri": uri}


# Severity inference (if exported model exists)
class SeverityResponse(BaseModel):
    severityPercentage: float
    severityBand: str
    confidence: float


def severity_band(pct: float) -> str:
    if pct < 30:
        return 'Low'
    elif pct < 60:
        return 'Medium'
    return 'High'


@app.post("/severity", response_model=SeverityResponse)
async def severity(file: UploadFile = File(...)):
    if not SEV_EXPORT.exists():
        raise HTTPException(status_code=404, detail="Severity model not available")

    # Lazy-load model
    model = getattr(app.state, 'severity_model', None)
    if model is None:
        app.state.severity_model = torch.jit.load(str(SEV_EXPORT), map_location='cpu').eval()
        model = app.state.severity_model

    data = await file.read()
    pil = read_image_to_pil(data)
    x = tensor_from_image(pil)

    with torch.no_grad():
        y = model(x).cpu().numpy()[0][0]
    pct = float(np.clip(y, 0, 100))
    band = severity_band(pct)
    # Use a naive confidence proxy since we didn't calibrate yet
    conf = max(0.0, min(1.0, 1.0 - abs(y - pct) / 100.0))

    return {
        "severityPercentage": pct,
        "severityBand": band,
        "confidence": conf,
    }
