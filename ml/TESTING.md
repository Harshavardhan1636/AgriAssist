# AgriAssist Model Testing Guide

This guide explains how to use the `test_models.py` script to evaluate your trained models.

## Prerequisites

Before running the tests, ensure you have installed the required dependencies:

```bash
pip install torch torchvision pillow numpy matplotlib
```

For Grad-CAM functionality (optional but recommended):

```bash
pip install pytorch-grad-cam
```

## Models Overview

1. **PlantVillage Classifier**: Trained on the PlantVillage dataset with 15 classes including:
   - Pepper bacterial spot and healthy
   - Potato Early blight, Late blight, and healthy
   - Tomato diseases (Bacterial spot, Early blight, Late blight, Leaf Mold, Septoria leaf spot, Spider mites, Target Spot, Tomato Yellow Leaf Curl Virus, Tomato mosaic virus) and healthy

2. **Paddy Classifier**: Trained on rice/paddy diseases with 10 classes including:
   - Various bacterial diseases (leaf blight, leaf streak, panicle blight)
   - Fungal diseases (blast, brown spot, downy mildew)
   - Insect damage (hispa, tungro, dead heart)
   - Normal/healthy plants

3. **Severity Prediction Model**: Regression model that predicts the percentage of plant affected by disease (0-100%)

## Usage

### Basic Usage

Test all models with a sample image:

```bash
python ml/test_models.py path/to/your/image.jpg
```

### Test Specific Models

Test only the PlantVillage classifier:

```bash
python ml/test_models.py path/to/your/image.jpg --models plantvillage
```

Test only the Paddy classifier and severity model:

```bash
python ml/test_models.py path/to/your/image.jpg --models paddy severity
```

Test all models except Grad-CAM:

```bash
python ml/test_models.py path/to/your/image.jpg --models plantvillage paddy severity
```

### Control Prediction Output

Change the number of top predictions shown (default is 5):

```bash
python ml/test_models.py path/to/your/image.jpg --topk 3
```

### Grad-CAM Visualization

Test Grad-CAM with the PlantVillage model:

```bash
python ml/test_models.py path/to/your/image.jpg --models gradcam --gradcam-model plantvillage
```

Test Grad-CAM with the Paddy model:

```bash
python ml/test_models.py path/to/your/image.jpg --models gradcam --gradcam-model paddy
```

Focus Grad-CAM on a specific class (if available in the model):

```bash
python ml/test_models.py path/to/your/image.jpg --models gradcam --gradcam-model plantvillage --target-label "Tomato_Late_blight"
```

Skip displaying visualizations (useful for batch processing):

```bash
python ml/test_models.py path/to/your/image.jpg --models gradcam --no-display
```

## Understanding the Output

### Classification Results

For each classifier, you'll see the top predictions in this format:
```
 1. Tomato_Late_blight                        0.9234
 2. Tomato_Early_blight                       0.0512
 3. Tomato_healthy                            0.0187
 ...
```
The numbers represent confidence scores (higher is more confident).

### Severity Prediction

The severity model outputs:
```
Severity Prediction:
------------------------------
Percentage: 45.23%
Band:       Medium
```
- **Percentage**: Estimated percentage of the plant affected by disease (0-100%)
- **Band**: Categorical severity level (Low: <30%, Medium: 30-60%, High: >60%)

### Grad-CAM Visualization

If Grad-CAM is available, the script will:
1. Generate a heatmap showing which parts of the image the model focused on
2. Save the visualization as a PNG file (e.g., `image_gradcam_plantvillage.png`)
3. Display the original image and Grad-CAM side-by-side (unless --no-display is used)

## Troubleshooting

### ImportError: No module named 'pytorch_grad_cam'

Install the Grad-CAM package:
```bash
pip install pytorch-grad-cam
```

### FileNotFoundError for model files

Ensure your trained models are in the correct directories:
- PlantVillage classifier: `ml/runs/classifier/export/`
- Paddy classifier: `ml/runs/classifier_paddy/export/`
- Severity model: `ml/runs/severity_regression/export/`

### CUDA out of memory

The script runs on CPU by default. If you're using a GPU and encounter memory issues, you can modify the script to use less memory or process smaller images.

## Model Architecture Details

### Classifiers

Both classifiers use either MobileNetV2 or EfficientNet backbones with a custom classification head. The models expect:
- Input images: 256x256 RGB
- Preprocessing: Normalization with ImageNet statistics

### Severity Model

The severity regression model also uses a MobileNetV2 or EfficientNet backbone but with a regression head that outputs a single value representing the percentage of disease severity.

## Extending the Script

You can modify the script to:
1. Process multiple images in batch mode
2. Save results to CSV files
3. Compare predictions across models
4. Add new evaluation metrics