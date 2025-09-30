# AgriAssist ML Training: GPU-Ready Pipeline (RTX 4050)

This directory contains the complete blueprint and practical setup to train the AI models powering AgriAssist using your local NVIDIA RTX 4050 GPU. It aligns with the application flows and the detailed AI model development plan.

Contents
- Model roles and deliverables (what each model outputs for the app)
- Dataset structure and requirements
- Windows + NVIDIA GPU setup (RTX 4050 CUDA)
- Training recipes and commands
- Export and inference integration notes
- Roadmap for fine-tuning Gemini with your data

Models and deliverables
1) Plant Disease Classifier (CV)
   - Task: Multi-class classification on leaf images (e.g., Tomato Late Blight, Potato Early Blight, Healthy)
   - Backbone: MobileNetV2 or EfficientNet (transfer learning)
   - Output: JSON predictions as expected by the app, e.g.
     {
       "predictions": [
         { "label": "Tomato Late Blight", "confidence": 0.92 },
         { "label": "Tomato Early Blight", "confidence": 0.05 }
       ]
     }
   - Also used as the feature extractor for Grad-CAM (XAI)

2) Explainability: Grad-CAM
   - Task: Heatmap overlay highlighting pixels that contributed most to the top prediction
   - Input: Trained classifier + input image
   - Output: PNG heatmap (base64 data URI for frontend use)

3) Disease Severity Assessment
   - Option A: Regression (simpler, faster to implement)
     - Output: severity percentage (0-100)
   - Option B: Segmentation (U-Net)
     - Output: per-pixel diseased mask; severity = diseased_pixels / leaf_pixels
   - For MVP: start with regression; enable U-Net when you have annotated masks.

4) LLM-based Tasks (Fine-Tune Gemini)
   - Tasks: forecastOutbreakRisk, generateRecommendations, diagnoseWithText, askFollowUpQuestion
   - Method: dataset of prompt/ideal-response pairs and Gemini fine-tuning (outside python training here)

Dataset layout (expected)
Place your datasets under the project root in datasets/. The training code will read from these folders.

- datasets/
  - classification/
    - Tomato Late Blight/
      - img_0001.jpg
      - ...
    - Tomato Early Blight/
    - Potato Early Blight/
    - Potato Late Blight/
    - Maize Common Rust/
    - Healthy/
  - severity_regression/
    - images/
      - img_0001.jpg
      - ...
    - labels.csv
      - columns: filename,severity
      - sample: img_0001.jpg,34.5  # percentage 0..100
  - severity_segmentation/   (optional - only if you have masks)
    - images/
      - img_0001.jpg
    - masks/
      - img_0001.png  # binary or indexed mask (0=healthy, 1=diseased)

Windows + RTX 4050 GPU setup
You need Python 3.10 or 3.11 (recommended) and a CUDA-enabled PyTorch build.

1) Create virtual environment
- Start PowerShell in the project root (AgriAssist)

  python --version
  # Ensure Python 3.10+ is available

  python -m venv .venv
  .\.venv\Scripts\Activate.ps1

2) Install CUDA-enabled PyTorch (CUDA 12.1 recommended for 4050)

  pip install --upgrade pip
  pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

3) Install common ML dependencies

  pip install -U numpy pillow scikit-learn tqdm opencv-python matplotlib albumentations
  pip install pytorch-grad-cam torchmetrics

Verify GPU availability in Python:

  python -c "import torch; print('CUDA:', torch.cuda.is_available(), 'Device:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU')"

Training recipes (scripts will be added in ml/)

Classifier (Transfer Learning: MobileNetV2)
- Goal: train and export a .pt TorchScript model and a label mapping JSON
- Augmentations: flips, rotations, color jitter, random resize/crop
- Freeze base -> train head; then partial unfreeze and fine-tune with low LR

Command template (after scripts are added):

  # Activate venv first
  .\.venv\Scripts\Activate.ps1

  # Train classifier
  python ml/train_classifier.py \
    --data_dir datasets/classification \
    --epochs 20 \
    --batch_size 32 \
    --lr 1e-3 \
    --model mobilenet_v2 \
    --img_size 256 \
    --val_split 0.1 \
    --output_dir ml/runs/classifier

  # Export TorchScript + label map
  python ml/train_classifier.py --export_only --checkpoint ml/runs/classifier/best.ckpt --output_dir ml/exports/classifier

Grad-CAM heatmaps
- Generates data URI PNG overlay from an input image and a trained classifier

  python ml/grad_cam_infer.py \
    --checkpoint ml/exports/classifier/model.ts.pt \
    --label_map ml/exports/classifier/labels.json \
    --image_path path/to/image.jpg \
    --target_class "Tomato Late Blight" \
    --output heatmap.png --as_data_uri

Severity (Regression)
- Uses the same augmentations; final head predicts a single value in [0, 100]

  python ml/train_severity_regression.py \
    --images_dir datasets/severity_regression/images \
    --labels_csv datasets/severity_regression/labels.csv \
    --epochs 20 \
    --batch_size 32 \
    --lr 1e-3 \
    --model mobilenet_v2 \
    --img_size 256 \
    --val_split 0.1 \
    --output_dir ml/runs/severity_regression

Optional: Severity (Segmentation - U-Net)
- Requires annotated masks
- Delivers per-pixel masks + severity by pixel ratio
- Script: ml/train_unet.py (to be added once masks exist)

Checkpoints, exports and reproducibility
- Checkpoints go under ml/runs/* by default
- Exports: ml/exports/* (TorchScript models and metadata)
- Random seeds fixed in scripts for reproducibility
- Training resumes from last checkpoint with --resume flag (where supported)

Integration notes (backend)
- Exported TorchScript models can be loaded in a Node/TS backend via TorchServe/Triton, or wrapped by a Python microservice (FastAPI) and called from your Next.js /api/analyze endpoint.
- Grad-CAM service should return a data URI string for explanation.gradCAMOverlay.
- Severity regression service returns { severityPercentage: number, severityBand: 'Low'|'Medium'|'High', confidence: number }.
- Label mapping JSON is required at inference time to convert logits to disease labels used by frontend.

GPU utilization best practices (RTX 4050)
- Use mixed precision (AMP) for speed/memory (scripts enable autocast + GradScaler)
- Tune batch size up to GPU memory capacity (start 32 then increase/decrease)
- Use pin_memory=True, num_workers>0 for DataLoader
- For fine-tuning, keep LR small when unfreezing base layers (1e-4 or less)

Monitoring & debugging
- Scripts will print train/val metrics per epoch
- Optionally add TensorBoard later; baseline keeps deps minimal

Roadmap: Gemini fine-tuning
- Create prompt-response datasets from existing flows (src/ai/flows) output patterns
- Define JSONL datasets for generateRecommendations, forecastOutbreakRisk, diagnoseWithText, askFollowUpQuestion
- Follow Gemini fine-tuning guide; store dataset versions and prompt schemas in version control

Troubleshooting
- If torch.cuda.is_available() is False:
  - Update NVIDIA drivers
  - Ensure CUDA toolkit suitable for your driver; the PyTorch cu121 wheel embeds CUDA, no system toolkit required
  - Reinstall torch with the CUDA index URL above
- If dataloaders are slow on Windows, reduce num_workers or set it to 0

Status
- This README prepares the full environment and command surface
- Next step: add scripts under ml/ (train_classifier.py, grad_cam_infer.py, train_severity_regression.py). These will be created to be runnable as-is and consume datasets/ paths you already maintain.

# AgriAssist Machine Learning Models

This directory contains all the machine learning models and tools for the AgriAssist agricultural disease detection system.

## 📁 Directory Structure

```
ml/
├── exports/                    # Exported models for inference
│   ├── classifier/             # PlantVillage classifier (general crops)
│   ├── classifier_paddy/       # Paddy classifier (rice-specific)
│   └── severity_regression/    # Disease severity assessment
├── scripts/                    # Testing and evaluation scripts
│   ├── test_models.py          # Main testing interface
│   ├── batch_test.py           # Batch processing of multiple images
│   └── ...                     # Additional testing tools
├── utils/                      # Utility scripts and helpers
│   ├── validate_models.py      # Model validation tools
│   └── ...                     # Additional utilities
├── docs/                       # Documentation and guides
│   ├── README.md               # Main documentation
│   ├── TESTING.md              # Testing guide
│   └── ...                     # Additional documentation
├── results/                    # Test results and evaluations
│   ├── *.csv                   # Batch test results
│   └── ...                     # Evaluation reports
├── test_images/                # Sample test images
├── infer_server.py             # FastAPI inference server
├── train_pipeline.py           # Model training pipeline
└── requirements.txt            # Python dependencies
```

## 🚀 Quick Start

1. **Test the models**:
   ```bash
   cd scripts
   python test_models.py ../test_images/test_leaf.jpg
   ```

2. **Start the inference server**:
   ```bash
   python infer_server.py
   ```

3. **Run batch tests**:
   ```bash
   cd scripts
   python batch_test.py ../test_images/ -o ../results/batch_results.csv
   ```

## 📚 Documentation

For detailed instructions, see the documentation in the [docs](docs/) directory:
- [Testing Guide](docs/TESTING.md)
- [Quick Start](docs/QUICK_START.md)
- [Complete Testing Summary](docs/FINAL_SUMMARY.md)

## 🛠️ Requirements

Install the required dependencies:
```bash
pip install -r requirements.txt
```

Key dependencies:
- PyTorch (with CUDA support)
- TorchVision
- PIL/Pillow
- NumPy
- FastAPI
- pytorch-grad-cam (for Grad-CAM visualizations)

## ✅ Models Overview

| Model | Purpose | Status |
|-------|---------|--------|
| PlantVillage Classifier | General plant disease identification | ✅ Ready |
| Paddy Classifier | Rice-specific disease identification | ✅ Ready |
| Severity Prediction | Disease extent estimation | ✅ Ready |
| Grad-CAM Visualization | Model explainability | ✅ Ready |

## 🎯 Next Steps

1. Test with real plant disease images from your datasets
2. Evaluate model accuracy with ground truth data
3. Analyze Grad-CAM visualizations for model interpretability
4. Deploy the FastAPI server for production use

For any questions about using these tools, refer to the documentation files or run:
```bash
python scripts/test_models.py --help
python scripts/batch_test.py --help
```

# AgriAssist ML Models - Testing and Evaluation

This directory contains all the tools and documentation needed to test and evaluate your trained agricultural AI models.

## 📋 Models Overview

| Model | Purpose | Status |
|-------|---------|--------|
| PlantVillage Classifier | General plant disease identification | ✅ Ready |
| Paddy Classifier | Rice-specific disease identification | ✅ Ready |
| Severity Prediction | Disease extent estimation | ✅ Ready |
| Grad-CAM Visualization | Model explainability | ✅ Ready |

## 🚀 Quick Start

1. **Validate your models**:
   ```bash
   python validate_models.py
   ```

2. **Test with a sample image**:
   ```bash
   python test_models.py test_leaf.jpg
   ```

3. **Generate Grad-CAM visualizations**:
   ```bash
   python test_models.py test_leaf.jpg --models gradcam --gradcam-model plantvillage
   ```

## 📁 Directory Structure

```
ml/
├── runs/
│   ├── classifier/              # PlantVillage model
│   ├── classifier_paddy/        # Paddy model  
│   └── severity_regression/     # Severity model
├── test_models.py              # Main testing interface
├── validate_models.py          # Model validation
├── batch_test.py               # Batch processing
└── ...                         # Additional tools and documentation
```

## 🛠️ Testing Tools

### Main Testing Script
```bash
python test_models.py image.jpg [--models model1 model2] [--gradcam-model plantvillage|paddy]
```

### Batch Testing
```bash
python batch_test.py image_directory -o results.csv
```

### Model Validation
```bash
python validate_models.py
```

## 📚 Documentation

- [TESTING.md](TESTING.md) - Comprehensive testing guide
- [QUICK_START.md](QUICK_START.md) - Quick start instructions
- [SUMMARY_REPORT.md](SUMMARY_REPORT.md) - Testing results summary
- [FINAL_SUMMARY.md](FINAL_SUMMARY.md) - Complete overview

## ✅ Verified Functionality

All models have been successfully tested and verified:

- **Classification**: Both PlantVillage and Paddy classifiers working correctly
- **Severity Prediction**: Percentage-based disease severity estimation
- **Grad-CAM**: Heatmap visualization showing model decision-making
- **Batch Processing**: Multiple image processing capabilities

## 🎯 Next Steps

1. Test with real plant disease images
2. Evaluate model accuracy with ground truth data
3. Analyze Grad-CAM visualizations for model interpretability
4. Run batch tests on larger datasets
5. Integrate with the FastAPI inference server

For detailed instructions, see [TESTING.md](TESTING.md)
