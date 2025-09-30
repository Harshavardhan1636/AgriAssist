#!/usr/bin/env python3
"""
Test script for AgriAssist models
This script allows you to test:
1. PlantVillage classifier model
2. Paddy classifier model
3. Severity prediction model
4. Grad-CAM visualization
"""

import os
import io
import json
import base64
import argparse
from pathlib import Path
from PIL import Image
import numpy as np
import torch
import torch.nn as nn
from torchvision import transforms
import matplotlib.pyplot as plt

# Try to import Grad-CAM
try:
    from pytorch_grad_cam import GradCAM
    from pytorch_grad_cam.utils.image import show_cam_on_image
    HAS_GRADCAM = True
except ImportError:
    HAS_GRADCAM = False
    print("Warning: pytorch-grad-cam not installed. Grad-CAM functionality will be disabled.")
    print("To enable Grad-CAM, install it with: pip install pytorch-grad-cam")

# Define paths
ROOT = Path(__file__).resolve().parent
RUNS = ROOT / 'runs'

PV_EXPORT = RUNS / 'classifier' / 'export'
PV_CKPT = RUNS / 'classifier' / 'best.pth'
PADDY_EXPORT = RUNS / 'classifier_paddy' / 'export'
PADDY_CKPT = RUNS / 'classifier_paddy' / 'best.pth'
SEV_EXPORT = RUNS / 'severity_regression' / 'export' / 'severity_regression.ts.pt'

# Preprocessing transforms (same as in infer_server.py)
IMG_SIZE = 256
VAL_TF = transforms.Compose([
    transforms.Resize(int(IMG_SIZE * 1.15)),
    transforms.CenterCrop(IMG_SIZE),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def load_torchscript_classifier(export_dir: Path):
    """Load a TorchScript classifier model and its labels"""
    model_path = export_dir / 'model.ts.pt'
    labels_path = export_dir / 'labels.json'
    
    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found: {model_path}")
    if not labels_path.exists():
        raise FileNotFoundError(f"Labels file not found: {labels_path}")
        
    model = torch.jit.load(str(model_path), map_location='cpu')
    model.eval()
    
    with open(labels_path, 'r', encoding='utf-8') as f:
        labels = json.load(f)
    # Convert string indices to int indices
    idx_to_label = {int(k): v for k, v in labels.items()}
    
    return model, idx_to_label

def softmax_logits(logits: torch.Tensor) -> np.ndarray:
    """Apply softmax to logits"""
    sm = torch.softmax(logits, dim=1).detach().cpu().numpy()[0]
    return sm

def read_image_to_pil(image_path: str) -> Image.Image:
    """Read an image file and convert to PIL Image"""
    return Image.open(image_path).convert('RGB')

def tensor_from_image(pil: Image.Image) -> torch.Tensor:
    """Convert PIL image to tensor"""
    return VAL_TF(pil).unsqueeze(0)

def classify_image(model, labels, image_path: str, topk: int = 5):
    """Classify an image using the provided model"""
    print(f"Classifying image: {image_path}")
    
    # Load and preprocess image
    pil = read_image_to_pil(image_path)
    x = tensor_from_image(pil)
    
    # Run inference
    with torch.no_grad():
        logits = model(x)
    probs = softmax_logits(logits)
    
    # Get top-k predictions
    topk = max(1, min(topk, len(probs)))
    idxs = np.argsort(probs)[::-1][:topk]
    
    print(f"\nTop {topk} predictions:")
    print("-" * 50)
    for i, idx in enumerate(idxs):
        label = labels.get(int(idx), str(idx))
        confidence = float(probs[idx])
        print(f"{i+1:2d}. {label:<40} {confidence:.4f}")
    
    return idxs, probs

def severity_band(pct: float) -> str:
    """Convert severity percentage to band"""
    if pct < 30:
        return 'Low'
    elif pct < 60:
        return 'Medium'
    return 'High'

def predict_severity(image_path: str):
    """Predict severity using the severity model"""
    print(f"Predicting severity for image: {image_path}")
    
    if not SEV_EXPORT.exists():
        raise FileNotFoundError(f"Severity model not found: {SEV_EXPORT}")
    
    # Load model
    model = torch.jit.load(str(SEV_EXPORT), map_location='cpu')
    model.eval()
    
    # Load and preprocess image
    pil = read_image_to_pil(image_path)
    x = tensor_from_image(pil)
    
    # Run inference
    with torch.no_grad():
        y = model(x).cpu().numpy()[0][0]
    
    pct = float(np.clip(y, 0, 100))
    band = severity_band(pct)
    
    print(f"\nSeverity Prediction:")
    print("-" * 30)
    print(f"Percentage: {pct:.2f}%")
    print(f"Band:       {band}")
    
    return pct, band

def build_classifier(backbone: str, num_classes: int) -> nn.Module:
    """Build a classifier model from backbone"""
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

def gradcam_from_ckpt(ckpt_path: Path, image_path: str, target_label: str = None):
    """Generate Grad-CAM visualization using checkpoint"""
    if not HAS_GRADCAM:
        raise RuntimeError("Grad-CAM not available. Please install pytorch-grad-cam.")
    
    if not ckpt_path.exists():
        raise FileNotFoundError(f"Checkpoint not found: {ckpt_path}")
    
    # Load checkpoint
    ckpt = torch.load(str(ckpt_path), map_location='cpu')
    backbone = ckpt.get('backbone', 'mobilenet_v2')
    class_to_idx = ckpt['class_to_idx']
    idx_to_class = {v: k for k, v in class_to_idx.items()}
    
    # Load and preprocess image
    pil = read_image_to_pil(image_path)
    x = tensor_from_image(pil)
    
    # Build and load model
    model = build_classifier(backbone, num_classes=len(class_to_idx))
    model.load_state_dict(ckpt['model_state'])
    model.eval()
    
    # Find target class index
    target_class_idx = None
    if target_label:
        target_class_idx = class_to_idx.get(target_label)
        if target_class_idx is None:
            print(f"Warning: Target label '{target_label}' not found in class mapping")
            print("Available classes:", list(class_to_idx.keys()))
    
    # Choose target layer for Grad-CAM
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
        raise RuntimeError("Could not find convolutional layer for Grad-CAM")
    
    # Generate Grad-CAM
    cam = GradCAM(model=model, target_layers=[target_layer], use_cuda=False)
    
    # If we have a specific target class, create a target
    targets = None
    if target_class_idx is not None:
        # You might need to create a specific target class here
        # For now, we'll use None which means the class with highest score
        pass
    
    grayscale_cam = cam(input_tensor=x, targets=targets)[0]
    
    # Create visualization
    disp = pil.resize((IMG_SIZE, IMG_SIZE))
    disp_np = np.array(disp).astype(np.float32) / 255.0
    cam_image = show_cam_on_image(disp_np, grayscale_cam, use_rgb=True, image_weight=0.55)
    
    return cam_image, grayscale_cam

def visualize_gradcam(image_path: str, cam_image: np.ndarray, model_name: str):
    """Visualize Grad-CAM results"""
    # Load original image
    orig_img = Image.open(image_path).convert('RGB')
    
    # Create side-by-side comparison
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 6))
    
    ax1.imshow(orig_img)
    ax1.set_title('Original Image')
    ax1.axis('off')
    
    ax2.imshow(cam_image)
    ax2.set_title(f'Grad-CAM ({model_name})')
    ax2.axis('off')
    
    plt.tight_layout()
    plt.show()

def test_plantvillage_classifier(image_path: str, topk: int = 5):
    """Test the PlantVillage classifier"""
    print("=" * 60)
    print("Testing PlantVillage Classifier")
    print("=" * 60)
    
    if not PV_EXPORT.exists():
        raise FileNotFoundError("PlantVillage classifier not found")
    
    model, labels = load_torchscript_classifier(PV_EXPORT)
    classify_image(model, labels, image_path, topk)

def test_paddy_classifier(image_path: str, topk: int = 5):
    """Test the Paddy classifier"""
    print("\n" + "=" * 60)
    print("Testing Paddy Classifier")
    print("=" * 60)
    
    if not PADDY_EXPORT.exists():
        raise FileNotFoundError("Paddy classifier not found")
    
    model, labels = load_torchscript_classifier(PADDY_EXPORT)
    classify_image(model, labels, image_path, topk)

def test_severity_model(image_path: str):
    """Test the severity prediction model"""
    print("\n" + "=" * 60)
    print("Testing Severity Prediction Model")
    print("=" * 60)
    
    predict_severity(image_path)

def test_gradcam(image_path: str, model_key: str, target_label: str = None):
    """Test Grad-CAM visualization"""
    if not HAS_GRADCAM:
        print("Grad-CAM not available. Skipping visualization.")
        return
    
    print("\n" + "=" * 60)
    print(f"Testing Grad-CAM for {model_key}")
    print("=" * 60)
    
    if model_key == 'plantvillage':
        ckpt_path = PV_CKPT
        model_name = "PlantVillage"
    elif model_key == 'paddy':
        ckpt_path = PADDY_CKPT
        model_name = "Paddy"
    else:
        raise ValueError(f"Unknown model_key: {model_key}")
    
    if not ckpt_path.exists():
        raise FileNotFoundError(f"Checkpoint not found: {ckpt_path}")
    
    try:
        cam_image, grayscale_cam = gradcam_from_ckpt(ckpt_path, image_path, target_label)
        print(f"Grad-CAM generated successfully for {model_key}")
        print(f"Visualization shape: {cam_image.shape}")
        
        # Save the Grad-CAM image
        output_path = Path(image_path).stem + f"_gradcam_{model_key}.png"
        cam_pil = Image.fromarray(cam_image)
        cam_pil.save(output_path)
        print(f"Grad-CAM visualization saved to: {output_path}")
        
        return cam_image
    except Exception as e:
        print(f"Error generating Grad-CAM: {e}")
        return None

def main():
    parser = argparse.ArgumentParser(description="Test AgriAssist models")
    parser.add_argument("image", help="Path to test image")
    parser.add_argument("--topk", type=int, default=5, help="Number of top predictions to show")
    parser.add_argument("--models", nargs="+", default=["plantvillage", "paddy", "severity", "gradcam"],
                        choices=["plantvillage", "paddy", "severity", "gradcam"],
                        help="Which models to test")
    parser.add_argument("--gradcam-model", choices=["plantvillage", "paddy"], 
                        help="Which model to use for Grad-CAM")
    parser.add_argument("--target-label", help="Target label for Grad-CAM")
    parser.add_argument("--no-display", action="store_true", help="Don't display visualizations")
    
    args = parser.parse_args()
    
    # Check if image exists
    if not os.path.exists(args.image):
        print(f"Error: Image file not found: {args.image}")
        return
    
    print(f"Testing models with image: {args.image}")
    
    # Test classifiers
    if "plantvillage" in args.models:
        try:
            test_plantvillage_classifier(args.image, args.topk)
        except Exception as e:
            print(f"Error testing PlantVillage classifier: {e}")
    
    if "paddy" in args.models:
        try:
            test_paddy_classifier(args.image, args.topk)
        except Exception as e:
            print(f"Error testing Paddy classifier: {e}")
    
    # Test severity model
    if "severity" in args.models:
        try:
            test_severity_model(args.image)
        except Exception as e:
            print(f"Error testing severity model: {e}")
    
    # Test Grad-CAM
    if "gradcam" in args.models:
        model_key = args.gradcam_model or "plantvillage"  # Default to plantvillage
        try:
            cam_image = test_gradcam(args.image, model_key, args.target_label)
            if cam_image is not None and not args.no_display:
                visualize_gradcam(args.image, cam_image, model_key)
        except Exception as e:
            print(f"Error testing Grad-CAM: {e}")

if __name__ == "__main__":
    main()