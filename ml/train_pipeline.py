import os
import json
import base64
import random
import argparse
from io import BytesIO
from typing import Tuple, Dict, Any, List

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, random_split, Dataset
from torchvision import transforms, datasets, models
from PIL import Image

try:
    from pytorch_grad_cam import GradCAM
    from pytorch_grad_cam.utils.image import show_cam_on_image
except Exception:
    GradCAM = None

SEED = 42
random.seed(SEED)
torch.manual_seed(SEED)


# -------------------- UTIL --------------------

def get_device() -> torch.device:
    if torch.cuda.is_available():
        try:
            name = torch.cuda.get_device_name(0)
        except Exception:
            name = 'CUDA'
        print(f"[INFO] Using GPU: {name}")
        return torch.device('cuda')
    print("[INFO] Using CPU (CUDA not available)")
    return torch.device('cpu')


# -------------------- TRANSFORMS --------------------

def get_classification_transforms(img_size: int) -> Tuple[transforms.Compose, transforms.Compose]:
    train_tf = transforms.Compose([
        transforms.RandomResizedCrop(img_size, scale=(0.8, 1.0)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.02),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    val_tf = transforms.Compose([
        transforms.Resize(int(img_size * 1.15)),
        transforms.CenterCrop(img_size),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    return train_tf, val_tf


# -------------------- MODELS --------------------

def build_classifier(backbone: str, num_classes: int, pretrained: bool = True) -> nn.Module:
    backbone = backbone.lower()
    if backbone == 'mobilenet_v2':
        model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT if pretrained else None)
        in_features = model.classifier[1].in_features
        model.classifier[1] = nn.Linear(in_features, num_classes)
        return model
    elif backbone.startswith('efficientnet_b'):
        eff = getattr(models, backbone, models.efficientnet_b0)
        weights_enum = getattr(models, f"{backbone}_weights", models.EfficientNet_B0_Weights)
        model = eff(weights=weights_enum.DEFAULT if pretrained else None)
        in_features = model.classifier[1].in_features
        model.classifier[1] = nn.Linear(in_features, num_classes)
        return model
    else:
        raise ValueError(f"Unsupported backbone: {backbone}")


def build_regression_model(backbone: str, pretrained: bool = True) -> nn.Module:
    backbone = backbone.lower()
    if backbone == 'mobilenet_v2':
        model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT if pretrained else None)
        in_features = model.classifier[1].in_features
        model.classifier[1] = nn.Linear(in_features, 1)
        return model
    elif backbone.startswith('efficientnet_b'):
        eff = getattr(models, backbone, models.efficientnet_b0)
        weights_enum = getattr(models, f"{backbone}_weights", models.EfficientNet_B0_Weights)
        model = eff(weights=weights_enum.DEFAULT if pretrained else None)
        in_features = model.classifier[1].in_features
        model.classifier[1] = nn.Linear(in_features, 1)
        return model
    else:
        raise ValueError(f"Unsupported backbone: {backbone}")


# -------------------- TRAIN/VAL LOOPS --------------------

def train_one_epoch(model, loader, criterion, optimizer, scaler, device, epoch, note: str = ""):
    model.train()
    running_loss = 0.0
    total = 0
    correct = 0
    for images, targets in loader:
        images = images.to(device, non_blocking=True)
        targets = targets.to(device, non_blocking=True)
        optimizer.zero_grad(set_to_none=True)
        with torch.cuda.amp.autocast(enabled=torch.cuda.is_available()):
            outputs = model(images)
            if outputs.ndim == 2 and outputs.shape[1] == 1 and targets.ndim == 2:  # regression
                loss = nn.MSELoss()(outputs, targets)
            else:
                loss = criterion(outputs, targets)
        scaler.scale(loss).backward()
        scaler.step(optimizer)
        scaler.update()
        running_loss += loss.item() * images.size(0)
        if outputs.ndim == 2 and outputs.shape[1] > 1:
            _, preds = torch.max(outputs, 1)
            total += targets.size(0)
            correct += (preds == targets).sum().item()
    if total > 0:
        acc = correct / max(1, total)
        print(f"[TRAIN] Epoch {epoch+1} - acc={acc:.4f} loss={running_loss/max(1, len(loader.dataset)):.4f} {note}")
    else:
        print(f"[TRAIN] Epoch {epoch+1} - loss={running_loss/max(1, len(loader.dataset)):.4f} {note}")


def eval_classifier(model, loader, criterion, device) -> Tuple[float, float]:
    model.eval()
    running_loss = 0.0
    total = 0
    correct = 0
    with torch.no_grad():
        for images, targets in loader:
            images = images.to(device, non_blocking=True)
            targets = targets.to(device, non_blocking=True)
            outputs = model(images)
            loss = criterion(outputs, targets)
            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            total += targets.size(0)
            correct += (preds == targets).sum().item()
    acc = correct / max(1, total)
    val_loss = running_loss / max(1, total)
    return acc, val_loss


def eval_regression(model, loader, device) -> Tuple[float, float]:
    model.eval()
    total = 0
    mae_sum = 0.0
    mse_sum = 0.0
    with torch.no_grad():
        for images, targets in loader:
            images = images.to(device, non_blocking=True)
            targets = targets.to(device, non_blocking=True)
            outputs = model(images)
            mse = nn.MSELoss()(outputs, targets).item()
            mae = torch.mean(torch.abs(outputs - targets)).item()
            n = images.size(0)
            total += n
            mae_sum += mae * n
            mse_sum += mse * n
    return mae_sum / max(1, total), mse_sum / max(1, total)


def export_torchscript_classifier(ckpt_path: str, export_dir: str):
    ckpt = torch.load(ckpt_path, map_location='cpu')
    backbone = ckpt['backbone']
    class_to_idx = ckpt['class_to_idx']
    img_size = ckpt.get('img_size', 256)
    model = build_classifier(backbone, num_classes=len(class_to_idx))
    model.load_state_dict(ckpt['model_state'])
    model.eval()
    example = torch.randn(1, 3, img_size, img_size)
    traced = torch.jit.trace(model, example)
    out_path = os.path.join(export_dir, 'model.ts.pt')
    traced.save(out_path)
    print(f"[INFO] TorchScript saved: {out_path}")


def export_torchscript_regression(ckpt_path: str, export_dir: str):
    ckpt = torch.load(ckpt_path, map_location='cpu')
    backbone = ckpt['backbone']
    img_size = ckpt.get('img_size', 256)
    model = build_regression_model(backbone)
    model.load_state_dict(ckpt['model_state'])
    model.eval()
    example = torch.randn(1, 3, img_size, img_size)
    traced = torch.jit.trace(model, example)
    out_path = os.path.join(export_dir, 'severity_regression.ts.pt')
    traced.save(out_path)
    print(f"[INFO] TorchScript saved: {out_path}")


# -------------------- IMAGEFOLDER CLASSIFIER --------------------

def split_imagefolder(dataset: datasets.ImageFolder, val_split: float) -> Tuple[Dataset, Dataset]:
    n_total = len(dataset)
    n_val = max(1, int(n_total * val_split))
    n_train = n_total - n_val
    return random_split(dataset, [n_train, n_val], generator=torch.Generator().manual_seed(SEED))


def train_classifier_imagefolder(
    data_dir: str,
    output_dir: str,
    backbone: str = 'mobilenet_v2',
    img_size: int = 256,
    batch_size: int = 32,
    epochs: int = 20,
    lr: float = 1e-3,
    val_split: float = 0.1,
    freeze_epochs: int = 3,
    num_workers: int = 4,
):
    device = get_device()
    os.makedirs(output_dir, exist_ok=True)

    train_tf, val_tf = get_classification_transforms(img_size)
    full_dataset = datasets.ImageFolder(root=data_dir, transform=train_tf)
    class_to_idx = full_dataset.class_to_idx
    idx_to_class = {v: k for k, v in class_to_idx.items()}

    train_subset, val_subset = split_imagefolder(full_dataset, val_split)
    val_subset.dataset.transform = val_tf

    train_loader = DataLoader(train_subset, batch_size=batch_size, shuffle=True, num_workers=num_workers, pin_memory=True)
    val_loader = DataLoader(val_subset, batch_size=batch_size, shuffle=False, num_workers=num_workers, pin_memory=True)

    model = build_classifier(backbone, num_classes=len(class_to_idx)).to(device)

    # Warmup: freeze backbone
    for p in model.parameters():
        p.requires_grad = False
    if hasattr(model, 'classifier'):
        for p in model.classifier.parameters():
            p.requires_grad = True

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=lr)
    scaler = torch.cuda.amp.GradScaler(enabled=torch.cuda.is_available())

    best_acc = 0.0
    best_path = os.path.join(output_dir, 'best.pth')

    for epoch in range(freeze_epochs):
        train_one_epoch(model, train_loader, criterion, optimizer, scaler, device, epoch, note='(head-only)')
        val_acc, val_loss = eval_classifier(model, val_loader, criterion, device)
        print(f"[WARMUP] Epoch {epoch+1}/{freeze_epochs} - val_acc={val_acc:.4f} val_loss={val_loss:.4f}")
        if val_acc > best_acc:
            best_acc = val_acc
            torch.save({'model_state': model.state_dict(), 'backbone': backbone, 'class_to_idx': class_to_idx, 'img_size': img_size}, best_path)

    # Fine-tune: unfreeze
    for p in model.parameters():
        p.requires_grad = True
    optimizer = optim.AdamW(model.parameters(), lr=lr * 0.1)

    for epoch in range(epochs):
        train_one_epoch(model, train_loader, criterion, optimizer, scaler, device, epoch)
        val_acc, val_loss = eval_classifier(model, val_loader, criterion, device)
        print(f"[FT] Epoch {epoch+1}/{epochs} - val_acc={val_acc:.4f} val_loss={val_loss:.4f}")
        if val_acc > best_acc:
            best_acc = val_acc
            torch.save({'model_state': model.state_dict(), 'backbone': backbone, 'class_to_idx': class_to_idx, 'img_size': img_size}, best_path)
            print(f"[INFO] Saved new best checkpoint: {best_path}")

    export_dir = os.path.join(output_dir, 'export')
    os.makedirs(export_dir, exist_ok=True)
    export_torchscript_classifier(best_path, export_dir)
    labels_path = os.path.join(export_dir, 'labels.json')
    with open(labels_path, 'w', encoding='utf-8') as f:
        json.dump({str(i): idx_to_class[i] for i in range(len(idx_to_class))}, f, ensure_ascii=False, indent=2)
    print(f"[INFO] Export complete: {export_dir}")


# -------------------- CSV CLASSIFIER (PADDY) --------------------

class ClassifierCSVDataset(Dataset):
    def __init__(self, images_dir: str, labels_csv: str, img_size: int, label_to_idx: Dict[str, int] = None):
        self.images_dir = images_dir
        self.samples: List[Tuple[str, str]] = []
        with open(labels_csv, 'r', encoding='utf-8') as f:
            lines = [line.strip() for line in f.readlines() if line.strip()]
        header = [h.strip() for h in lines[0].split(',')]
        # Expect columns containing at least image_id and label
        try:
            image_idx = header.index('image_id')
            label_idx = header.index('label')
        except ValueError:
            raise ValueError("CSV must contain 'image_id' and 'label' columns.")
        for row in lines[1:]:
            parts = [p.strip() for p in row.split(',')]
            if len(parts) <= max(image_idx, label_idx):
                continue
            image_id = parts[image_idx]
            label = parts[label_idx]
            self.samples.append((image_id, label))
        # Build label map if not provided
        if label_to_idx is None:
            classes = sorted(list({lbl for _, lbl in self.samples}))
            self.label_to_idx = {c: i for i, c in enumerate(classes)}
        else:
            self.label_to_idx = label_to_idx
        self.idx_to_label = {v: k for k, v in self.label_to_idx.items()}
        self.tf_train, self.tf_val = get_classification_transforms(img_size)
        self.use_train_tf = True

    def set_train(self, is_train: bool):
        self.use_train_tf = is_train

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        image_id, label = self.samples[idx]
        # Paddy dataset stores images in label subfolders: <images_dir>/<label>/<image_id>
        img_path = os.path.join(self.images_dir, label, image_id)
        if not os.path.isfile(img_path):
            # fallback if images are not nested by label
            fallback = os.path.join(self.images_dir, image_id)
            if os.path.isfile(fallback):
                img_path = fallback
            else:
                raise FileNotFoundError(f"Image not found: {img_path} or {fallback}")
        img = Image.open(img_path).convert('RGB')
        x = (self.tf_train if self.use_train_tf else self.tf_val)(img)
        y = torch.tensor(self.label_to_idx[label], dtype=torch.long)
        return x, y


def split_csv_dataset(ds: ClassifierCSVDataset, val_split: float) -> Tuple[Dataset, Dataset]:
    n_total = len(ds)
    n_val = max(1, int(n_total * val_split))
    n_train = n_total - n_val
    train_ds, val_ds = random_split(ds, [n_train, n_val], generator=torch.Generator().manual_seed(SEED))
    # Switch transforms per subset
    train_ds.dataset.set_train(True)
    val_ds.dataset.set_train(False)
    return train_ds, val_ds


def train_classifier_csv(
    images_dir: str,
    labels_csv: str,
    output_dir: str,
    backbone: str = 'mobilenet_v2',
    img_size: int = 256,
    batch_size: int = 32,
    epochs: int = 20,
    lr: float = 1e-3,
    val_split: float = 0.1,
    freeze_epochs: int = 3,
    num_workers: int = 4,
):
    device = get_device()
    os.makedirs(output_dir, exist_ok=True)

    base_ds = ClassifierCSVDataset(images_dir=images_dir, labels_csv=labels_csv, img_size=img_size)
    label_to_idx = base_ds.label_to_idx
    idx_to_class = {v: k for k, v in label_to_idx.items()}

    train_ds, val_ds = split_csv_dataset(base_ds, val_split)

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=num_workers, pin_memory=True)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=num_workers, pin_memory=True)

    model = build_classifier(backbone, num_classes=len(label_to_idx)).to(device)

    # Warmup: freeze backbone
    for p in model.parameters():
        p.requires_grad = False
    if hasattr(model, 'classifier'):
        for p in model.classifier.parameters():
            p.requires_grad = True

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=lr)
    scaler = torch.cuda.amp.GradScaler(enabled=torch.cuda.is_available())

    best_acc = 0.0
    best_path = os.path.join(output_dir, 'best.pth')

    for epoch in range(freeze_epochs):
        train_one_epoch(model, train_loader, criterion, optimizer, scaler, device, epoch, note='(head-only)')
        val_acc, val_loss = eval_classifier(model, val_loader, criterion, device)
        print(f"[WARMUP] Epoch {epoch+1}/{freeze_epochs} - val_acc={val_acc:.4f} val_loss={val_loss:.4f}")
        if val_acc > best_acc:
            best_acc = val_acc
            torch.save({'model_state': model.state_dict(), 'backbone': backbone, 'class_to_idx': label_to_idx, 'img_size': img_size}, best_path)

    for p in model.parameters():
        p.requires_grad = True
    optimizer = optim.AdamW(model.parameters(), lr=lr * 0.1)

    for epoch in range(epochs):
        train_one_epoch(model, train_loader, criterion, optimizer, scaler, device, epoch)
        val_acc, val_loss = eval_classifier(model, val_loader, criterion, device)
        print(f"[FT] Epoch {epoch+1}/{epochs} - val_acc={val_acc:.4f} val_loss={val_loss:.4f}")
        if val_acc > best_acc:
            best_acc = val_acc
            torch.save({'model_state': model.state_dict(), 'backbone': backbone, 'class_to_idx': label_to_idx, 'img_size': img_size}, best_path)
            print(f"[INFO] Saved new best checkpoint: {best_path}")

    export_dir = os.path.join(output_dir, 'export')
    os.makedirs(export_dir, exist_ok=True)
    export_torchscript_classifier(best_path, export_dir)
    labels_path = os.path.join(export_dir, 'labels.json')
    with open(labels_path, 'w', encoding='utf-8') as f:
        json.dump({str(i): idx_to_class[i] for i in range(len(idx_to_class))}, f, ensure_ascii=False, indent=2)
    print(f"[INFO] Export complete: {export_dir}")


# -------------------- SEVERITY REGRESSION --------------------

class SeverityDataset(Dataset):
    def __init__(self, images_dir: str, labels_csv: str, img_size: int):
        self.images_dir = images_dir
        self.samples: List[Tuple[str, float]] = []
        with open(labels_csv, 'r', encoding='utf-8') as f:
            lines = [line.strip() for line in f.readlines() if line.strip()]
        header = [h.strip() for h in lines[0].split(',')]
        try:
            file_idx = header.index('filename')
            sev_idx = header.index('severity')
        except ValueError:
            # fallback: assume 2 columns filename,severity
            file_idx, sev_idx = 0, 1
        for row in lines[1:]:
            parts = [p.strip() for p in row.split(',')]
            if len(parts) <= max(file_idx, sev_idx):
                continue
            fname = parts[file_idx]
            sev = float(parts[sev_idx])
            self.samples.append((fname, sev))
        self.tf = transforms.Compose([
            transforms.Resize(int(img_size * 1.15)),
            transforms.CenterCrop(img_size),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        fname, sev = self.samples[idx]
        img_path = os.path.join(self.images_dir, fname)
        img = Image.open(img_path).convert('RGB')
        x = self.tf(img)
        y = torch.tensor([sev], dtype=torch.float32)
        return x, y


def train_severity_regression(
    images_dir: str,
    labels_csv: str,
    output_dir: str,
    backbone: str = 'mobilenet_v2',
    img_size: int = 256,
    batch_size: int = 32,
    epochs: int = 20,
    lr: float = 1e-3,
    val_split: float = 0.1,
    num_workers: int = 4,
):
    device = get_device()
    os.makedirs(output_dir, exist_ok=True)

    full_ds = SeverityDataset(images_dir, labels_csv, img_size)
    n_total = len(full_ds)
    n_val = max(1, int(n_total * val_split))
    n_train = n_total - n_val
    train_ds, val_ds = random_split(full_ds, [n_train, n_val], generator=torch.Generator().manual_seed(SEED))

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=num_workers, pin_memory=True)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=num_workers, pin_memory=True)

    model = build_regression_model(backbone).to(device)
    optimizer = optim.AdamW(model.parameters(), lr=lr)
    scaler = torch.cuda.amp.GradScaler(enabled=torch.cuda.is_available())

    best_mae = float('inf')
    best_path = os.path.join(output_dir, 'best_regression.pth')

    for epoch in range(epochs):
        train_one_epoch(model, train_loader, None, optimizer, scaler, device, epoch)
        mae, mse = eval_regression(model, val_loader, device)
        print(f"[REG] Epoch {epoch+1}/{epochs} - val_mae={mae:.2f} val_mse={mse:.2f}")
        if mae < best_mae:
            best_mae = mae
            torch.save({'model_state': model.state_dict(), 'backbone': backbone, 'img_size': img_size}, best_path)
            print(f"[INFO] Saved new best regression checkpoint: {best_path}")

    export_dir = os.path.join(output_dir, 'export')
    os.makedirs(export_dir, exist_ok=True)
    export_torchscript_regression(best_path, export_dir)


# -------------------- GRAD-CAM --------------------

def gradcam_data_uri(
    ckpt_path: str,
    image_path: str,
    target_label: str,
    alpha: float = 0.45,
) -> str:
    if GradCAM is None:
        raise RuntimeError("pytorch-grad-cam not installed. Please install it to use Grad-CAM.")

    ckpt = torch.load(ckpt_path, map_location='cpu')
    backbone = ckpt['backbone']
    class_to_idx = ckpt['class_to_idx']

    img_size = ckpt.get('img_size', 256)
    _, val_tf = get_classification_transforms(img_size)
    pil = Image.open(image_path).convert('RGB')
    input_tensor = val_tf(pil).unsqueeze(0)

    model = build_classifier(backbone, num_classes=len(class_to_idx))
    model.load_state_dict(ckpt['model_state'])
    model.eval()

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
        raise RuntimeError("Could not find a suitable conv layer for Grad-CAM.")

    device = get_device()
    model = model.to(device)
    input_tensor = input_tensor.to(device)

    if target_label not in class_to_idx:
        raise ValueError(f"target_label '{target_label}' not in class_to_idx. Available: {list(class_to_idx.keys())}")
    with GradCAM(model=model, target_layers=[target_layer]) as cam:
        grayscale_cam = cam(input_tensor=input_tensor, targets=None)[0]

    disp = pil.resize((img_size, img_size))
    disp_np = np.array(disp).astype(np.float32) / 255.0
    cam_image = show_cam_on_image(disp_np, grayscale_cam, use_rgb=True, image_weight=(1.0 - alpha))
    out_img = Image.fromarray(cam_image)

    buf = BytesIO()
    out_img.save(buf, format='PNG')
    data = base64.b64encode(buf.getvalue()).decode('utf-8')
    return f"data:image/png;base64,{data}"


# -------------------- CLI --------------------

def main():
    parser = argparse.ArgumentParser(description='AgriAssist ML Training / Inference Pipeline (RTX 4050 Ready)')
    sub = parser.add_subparsers(dest='task', required=True)

    # ImageFolder classifier
    p_cls = sub.add_parser('classifier', help='Train and export classifier (ImageFolder)')
    p_cls.add_argument('--data_dir', type=str, default='datasets/plantvillage')
    p_cls.add_argument('--output_dir', type=str, default='ml/runs/classifier')
    p_cls.add_argument('--backbone', type=str, default='mobilenet_v2', choices=['mobilenet_v2', 'efficientnet_b0', 'efficientnet_b1'])
    p_cls.add_argument('--img_size', type=int, default=256)
    p_cls.add_argument('--batch_size', type=int, default=32)
    p_cls.add_argument('--epochs', type=int, default=20)
    p_cls.add_argument('--lr', type=float, default=1e-3)
    p_cls.add_argument('--val_split', type=float, default=0.1)
    p_cls.add_argument('--freeze_epochs', type=int, default=3)
    p_cls.add_argument('--num_workers', type=int, default=4)

    # CSV classifier (Paddy)
    p_csv = sub.add_parser('classifier_csv', help='Train and export classifier from CSV (e.g., paddy_disease/train.csv)')
    p_csv.add_argument('--images_dir', type=str, default='datasets/paddy_disease/train_images')
    p_csv.add_argument('--labels_csv', type=str, default='datasets/paddy_disease/train.csv')
    p_csv.add_argument('--output_dir', type=str, default='ml/runs/classifier_paddy')
    p_csv.add_argument('--backbone', type=str, default='mobilenet_v2', choices=['mobilenet_v2', 'efficientnet_b0', 'efficientnet_b1'])
    p_csv.add_argument('--img_size', type=int, default=256)
    p_csv.add_argument('--batch_size', type=int, default=32)
    p_csv.add_argument('--epochs', type=int, default=20)
    p_csv.add_argument('--lr', type=float, default=1e-3)
    p_csv.add_argument('--val_split', type=float, default=0.1)
    p_csv.add_argument('--freeze_epochs', type=int, default=3)
    p_csv.add_argument('--num_workers', type=int, default=4)

    # Severity regression
    p_reg = sub.add_parser('severity', help='Train and export severity regression model')
    p_reg.add_argument('--images_dir', type=str, default='datasets/severity_regression/images')
    p_reg.add_argument('--labels_csv', type=str, default='datasets/severity_regression/labels.csv')
    p_reg.add_argument('--output_dir', type=str, default='ml/runs/severity_regression')
    p_reg.add_argument('--backbone', type=str, default='mobilenet_v2', choices=['mobilenet_v2', 'efficientnet_b0', 'efficientnet_b1'])
    p_reg.add_argument('--img_size', type=int, default=256)
    p_reg.add_argument('--batch_size', type=int, default=32)
    p_reg.add_argument('--epochs', type=int, default=20)
    p_reg.add_argument('--lr', type=float, default=1e-3)
    p_reg.add_argument('--val_split', type=float, default=0.1)
    p_reg.add_argument('--num_workers', type=int, default=4)

    # Grad-CAM
    p_cam = sub.add_parser('gradcam', help='Generate Grad-CAM heatmap data URI')
    p_cam.add_argument('--ckpt', type=str, required=True)
    p_cam.add_argument('--image', type=str, required=True)
    p_cam.add_argument('--target_label', type=str, required=True)
    p_cam.add_argument('--alpha', type=float, default=0.45)

    args = parser.parse_args()

    if args.task == 'classifier':
        train_classifier_imagefolder(
            data_dir=args.data_dir,
            output_dir=args.output_dir,
            backbone=args.backbone,
            img_size=args.img_size,
            batch_size=args.batch_size,
            epochs=args.epochs,
            lr=args.lr,
            val_split=args.val_split,
            freeze_epochs=args.freeze_epochs,
            num_workers=args.num_workers,
        )
    elif args.task == 'classifier_csv':
        train_classifier_csv(
            images_dir=args.images_dir,
            labels_csv=args.labels_csv,
            output_dir=args.output_dir,
            backbone=args.backbone,
            img_size=args.img_size,
            batch_size=args.batch_size,
            epochs=args.epochs,
            lr=args.lr,
            val_split=args.val_split,
            freeze_epochs=args.freeze_epochs,
            num_workers=args.num_workers,
        )
    elif args.task == 'severity':
        train_severity_regression(
            images_dir=args.images_dir,
            labels_csv=args.labels_csv,
            output_dir=args.output_dir,
            backbone=args.backbone,
            img_size=args.img_size,
            batch_size=args.batch_size,
            epochs=args.epochs,
            lr=args.lr,
            val_split=args.val_split,
            num_workers=args.num_workers,
        )
    elif args.task == 'gradcam':
        uri = gradcam_data_uri(
            ckpt_path=args.ckpt,
            image_path=args.image,
            target_label=args.target_label,
            alpha=args.alpha,
        )
        print(uri)
    else:
        raise ValueError('Unknown task')


if __name__ == '__main__':
    main()
