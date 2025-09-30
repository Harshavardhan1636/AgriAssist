import os
import sys
import json
import time
import base64
import argparse
import subprocess
from pathlib import Path
from typing import List, Optional

ROOT = Path(__file__).resolve().parents[1]
ML_DIR = ROOT / 'ml'
DATASETS = ROOT / 'datasets'
PV_DIR = DATASETS / 'plantvillage'
PADDY_IMG_DIR = DATASETS / 'paddy_disease' / 'train_images'
PADDY_CSV = DATASETS / 'paddy_disease' / 'train.csv'

OUT_ROOT = ML_DIR / 'auto_outputs'
OUT_ROOT.mkdir(parents=True, exist_ok=True)
PREVIEW_DIR = OUT_ROOT / 'gradcam_preview'
PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE = OUT_ROOT / 'auto_run.log'


def log(msg: str):
    print(msg)
    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(time.strftime('%Y-%m-%d %H:%M:%S ') + msg + '\n')


def run(cmd: List[str], cwd: Optional[Path] = None, check: bool = True):
    log(f"$ {' '.join(cmd)}")
    proc = subprocess.run(cmd, cwd=str(cwd) if cwd else None, capture_output=True, text=True)
    if proc.stdout:
        log(proc.stdout)
    if proc.stderr:
        log(proc.stderr)
    if check and proc.returncode != 0:
        raise RuntimeError(f"Command failed: {' '.join(cmd)}\n{proc.stderr}")
    return proc


def find_first_images(root: Path, exts=(".jpg", ".jpeg", ".png"), per_class: int = 1, class_limit: int = 2):
    samples = []
    if not root.exists():
        return samples
    classes = sorted([d for d in root.iterdir() if d.is_dir()])[:class_limit]
    for c in classes:
        imgs = []
        for p in sorted(c.iterdir()):
            if p.suffix.lower() in exts:
                imgs.append(p)
            if len(imgs) >= per_class:
                break
        for img in imgs:
            samples.append((c.name, img))
    return samples


def data_uri_to_png(data_uri: str, out_path: Path):
    prefix = 'data:image/png;base64,'
    if not data_uri.startswith(prefix):
        raise ValueError('Unexpected data URI format')
    b64 = data_uri[len(prefix):]
    data = base64.b64decode(b64)
    out_path.write_bytes(data)


def ensure_cuda_available():
    code = "import torch;print('CUDA:',torch.cuda.is_available(), 'Device:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU')"
    proc = run([sys.executable, '-c', code], check=False)
    log(proc.stdout.strip())


def train_plantvillage():
    if not PV_DIR.exists():
        log('[PV] plantvillage not found; skipping classifier training.')
        return None
    out = ML_DIR / 'runs' / 'classifier'
    out.mkdir(parents=True, exist_ok=True)
    cmd = [
        sys.executable, str(ML_DIR / 'train_pipeline.py'), 'classifier',
        '--data_dir', str(PV_DIR),
        '--output_dir', str(out),
        '--backbone', 'mobilenet_v2',
        '--img_size', '256',
        '--batch_size', '32',
        '--epochs', '20',
        '--lr', '1e-3',
        '--val_split', '0.1',
        '--freeze_epochs', '3',
    ]
    run(cmd)
    return out


def train_paddy():
    if not PADDY_IMG_DIR.exists() or not PADDY_CSV.exists():
        log('[PADDY] train_images or train.csv not found; skipping CSV classifier training.')
        return None
    out = ML_DIR / 'runs' / 'classifier_paddy'
    out.mkdir(parents=True, exist_ok=True)
    cmd = [
        sys.executable, str(ML_DIR / 'train_pipeline.py'), 'classifier_csv',
        '--images_dir', str(PADDY_IMG_DIR),
        '--labels_csv', str(PADDY_CSV),
        '--output_dir', str(out),
        '--backbone', 'mobilenet_v2',
        '--img_size', '256',
        '--batch_size', '32',
        '--epochs', '20',
        '--lr', '1e-3',
        '--val_split', '0.1',
        '--freeze_epochs', '3',
    ]
    run(cmd)
    return out


def generate_gradcam_previews(ckpt_dir: Path, sample_pairs: List[tuple], tag: str):
    if ckpt_dir is None:
        return
    ckpt = ckpt_dir / 'best.pth'
    if not ckpt.exists():
        log(f'[{tag}] best.pth not found in {ckpt_dir}; skipping Grad-CAM previews.')
        return
    out_dir = PREVIEW_DIR / tag
    out_dir.mkdir(parents=True, exist_ok=True)
    for label, img_path in sample_pairs:
        cmd = [
            sys.executable, str(ML_DIR / 'train_pipeline.py'), 'gradcam',
            '--ckpt', str(ckpt),
            '--image', str(img_path),
            '--target_label', label,
            '--alpha', '0.45'
        ]
        proc = run(cmd, check=True)
        data_uri = proc.stdout.strip().splitlines()[-1]
        base = f"{label}__{img_path.stem}".replace(' ', '_').replace('/', '_')
        png_path = out_dir / f"{base}.png"
        txt_path = out_dir / f"{base}.txt"
        try:
            data_uri_to_png(data_uri, png_path)
            txt_path.write_text(data_uri, encoding='utf-8')
            log(f'[{tag}] Grad-CAM saved: {png_path.name}')
        except Exception as e:
            log(f'[{tag}] Failed to save Grad-CAM for {img_path}: {e}')


def train_severity_if_present():
    sev_img = DATASETS / 'severity_regression' / 'images'
    sev_csv = DATASETS / 'severity_regression' / 'labels.csv'
    if not sev_img.exists() or not sev_csv.exists():
        log('[SEVERITY] Dataset not found; skipping severity regression training.')
        return None
    out = ML_DIR / 'runs' / 'severity_regression'
    out.mkdir(parents=True, exist_ok=True)
    cmd = [
        sys.executable, str(ML_DIR / 'train_pipeline.py'), 'severity',
        '--images_dir', str(sev_img),
        '--labels_csv', str(sev_csv),
        '--output_dir', str(out),
        '--backbone', 'mobilenet_v2',
        '--img_size', '256',
        '--batch_size', '32',
        '--epochs', '20',
        '--lr', '1e-3',
        '--val_split', '0.1',
    ]
    run(cmd)
    return out


def main():
    parser = argparse.ArgumentParser(description='AgriAssist Full Auto-Training Orchestrator')
    parser.add_argument('--no_pv', action='store_true', help='Skip PlantVillage classifier')
    parser.add_argument('--no_paddy', action='store_true', help='Skip Paddy CSV classifier')
    parser.add_argument('--no_severity', action='store_true', help='Skip severity regression')
    parser.add_argument('--gradcam_per_class', type=int, default=1, help='Samples per class for Grad-CAM previews')
    parser.add_argument('--class_limit', type=int, default=2, help='Classes to sample for Grad-CAM previews')
    args = parser.parse_args()

    LOG_FILE.write_text('', encoding='utf-8')  # reset log
    log('== AgriAssist Auto Run Start ==')
    ensure_cuda_available()

    pv_out = None
    paddy_out = None
    sev_out = None

    # Train PV if not skipped
    if not args.no_pv:
        log('[PV] Training PlantVillage classifier...')
        pv_out = train_plantvillage()
    else:
        # Use existing run directory if present
        default_pv = ML_DIR / 'runs' / 'classifier'
        if (default_pv / 'best.pth').exists():
            pv_out = default_pv
            log('[PV] Skipping training. Using existing checkpoint at runs/classifier.')

    # Generate PV Grad-CAM previews if we have a checkpoint and samples
    samples = find_first_images(PV_DIR, per_class=args.gradcam_per_class, class_limit=args.class_limit)
    if pv_out and samples:
        log('[PV] Generating Grad-CAM previews...')
        generate_gradcam_previews(pv_out, samples, tag='plantvillage')
    elif pv_out and not samples:
        log('[PV] No images found to preview.')

    # Train Paddy if not skipped
    if not args.no_paddy:
        log('[PADDY] Training Paddy CSV classifier...')
        paddy_out = train_paddy()
    else:
        default_paddy = ML_DIR / 'runs' / 'classifier_paddy'
        if (default_paddy / 'best.pth').exists():
            paddy_out = default_paddy
            log('[PADDY] Skipping training. Using existing checkpoint at runs/classifier_paddy.')

    # Generate Paddy Grad-CAM previews if we have a checkpoint and samples
    paddy_samples = find_first_images(PADDY_IMG_DIR, per_class=args.gradcam_per_class, class_limit=args.class_limit)
    if paddy_out and paddy_samples:
        log('[PADDY] Generating Grad-CAM previews...')
        generate_gradcam_previews(paddy_out, paddy_samples, tag='paddy')
    elif paddy_out and not paddy_samples:
        log('[PADDY] No images found to preview.')

    # Train severity if not skipped
    if not args.no_severity:
        log('[SEVERITY] Training severity regression (if dataset exists)...')
        sev_out = train_severity_if_present()

    # Summary
    log('== SUMMARY ==')
    if pv_out:
        log(f"[PV] Classifier: {pv_out}")
        log(f"[PV] Export: {pv_out / 'export'}")
    if paddy_out:
        log(f"[PADDY] Classifier: {paddy_out}")
        log(f"[PADDY] Export: {paddy_out / 'export'}")
    if sev_out:
        log(f"[SEVERITY] Regression: {sev_out}")
        log(f"[SEVERITY] Export: {sev_out / 'export'}")

    log('Grad-CAM previews (if generated):')
    if PREVIEW_DIR.exists():
        for sub in PREVIEW_DIR.iterdir():
            if sub.is_dir():
                imgs = list(sub.glob('*.png'))
                log(f" - {sub.name}: {len(imgs)} images")
    log('== AgriAssist Auto Run Complete ==')


if __name__ == '__main__':
    main()
