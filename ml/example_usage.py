#!/usr/bin/env python3
"""
Example usage of AgriAssist models
This script demonstrates how to use the models programmatically
"""

import torch
from pathlib import Path
from test_models import (
    load_torchscript_classifier,
    classify_image,
    predict_severity,
    gradcam_from_ckpt
)

# Define paths
ROOT = Path(__file__).resolve().parent
RUNS = ROOT / 'runs'

PV_EXPORT = RUNS / 'classifier' / 'export'
PADDY_EXPORT = RUNS / 'classifier_paddy' / 'export'

def example_classification():
    """Example of using the classification models"""
    print("=== Classification Example ===")
    
    # Load PlantVillage classifier
    try:
        pv_model, pv_labels = load_torchscript_classifier(PV_EXPORT)
        print("PlantVillage classifier loaded successfully")
        print(f"Classes: {list(pv_labels.values())}")
    except Exception as e:
        print(f"Failed to load PlantVillage classifier: {e}")
        return
    
    # Load Paddy classifier
    try:
        paddy_model, paddy_labels = load_torchscript_classifier(PADDY_EXPORT)
        print("Paddy classifier loaded successfully")
        print(f"Classes: {list(paddy_labels.values())}")
    except Exception as e:
        print(f"Failed to load Paddy classifier: {e}")
        return

def example_severity():
    """Example of using the severity model"""
    print("\n=== Severity Prediction Example ===")
    
    # Note: This would require an actual image path
    print("To test severity prediction, run:")
    print("python ml/test_models.py path/to/your/image.jpg --models severity")

def example_gradcam():
    """Example of using Grad-CAM"""
    print("\n=== Grad-CAM Example ===")
    
    print("To test Grad-CAM, run:")
    print("python ml/test_models.py path/to/your/image.jpg --models gradcam")

if __name__ == "__main__":
    example_classification()
    example_severity()
    example_gradcam()
    
    print("\n=== Complete Test ===")
    print("To test all models with an image, run:")
    print("python ml/test_models.py path/to/your/image.jpg")