import os
import sys
import argparse
from collections import defaultdict

IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.bmp', '.webp'}


def is_image(fname: str) -> bool:
    return os.path.splitext(fname)[1].lower() in IMAGE_EXTS


def count_images_in_dir(root: str) -> int:
    total = 0
    for dirpath, _, filenames in os.walk(root):
        total += sum(1 for f in filenames if is_image(f))
    return total


def summarize_imagefolder(root: str):
    classes = []
    class_counts = {}
    if not os.path.isdir(root):
        print(f"[WARN] Not found: {root}")
        return
    for entry in sorted(os.listdir(root)):
        cpath = os.path.join(root, entry)
        if os.path.isdir(cpath):
            cnt = count_images_in_dir(cpath)
            classes.append(entry)
            class_counts[entry] = cnt
    if classes:
        print(f"[OK] ImageFolder root: {root}")
        print(f"     Classes: {len(classes)}")
        for c in classes:
            print(f"     - {c}: {class_counts[c]} images")
        total = sum(class_counts.values())
        print(f"     Total images: {total}")
        print()
    else:
        print(f"[WARN] No class subfolders found under {root}.")


def main():
    parser = argparse.ArgumentParser(description='Validate datasets layout for AgriAssist training')
    parser.add_argument('--root', type=str, default='datasets', help='Datasets root path (project-relative or absolute)')
    args = parser.parse_args()

    root = os.path.abspath(args.root)
    print(f"Datasets root: {root}")

    # Known datasets in this repo
    pv = os.path.join(root, 'plantvillage')
    paddy = os.path.join(root, 'paddy_disease')

    if os.path.isdir(pv):
        print("\n[PlantVillage] Detected. This can be used directly for classifier training.")
        summarize_imagefolder(pv)
        print("Suggested command:")
        print("  python ml/train_pipeline.py classifier --data_dir datasets/plantvillage --output_dir ml/runs/classifier --backbone mobilenet_v2 --img_size 256 --batch_size 32 --epochs 20 --lr 1e-3 --val_split 0.1 --freeze_epochs 3")
    else:
        print("\n[PlantVillage] Not found at datasets/plantvillage.")

    if os.path.isdir(paddy):
        print("\n[Paddy Disease] Detected (Kaggle-like layout with train.csv). This is NOT in ImageFolder format.")
        train_csv = os.path.join(paddy, 'train.csv')
        train_imgs = os.path.join(paddy, 'train_images')
        if os.path.isfile(train_csv) and os.path.isdir(train_imgs):
            # Count a few sample rows
            try:
                with open(train_csv, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                n = max(0, len(lines) - 1)
                print(f"  - train.csv rows (excluding header): {n}")
            except Exception as e:
                print(f"  - Could not read train.csv: {e}")
            print(f"  - train_images exists: {os.path.isdir(train_imgs)} (files inside: ~{count_images_in_dir(train_imgs)})")
            print("To use for classifier, either:")
            print("  A) Convert to ImageFolder by copying images into class-named subfolders; or")
            print("  B) Add a custom CSV loader to the pipeline (not provided by default).")
        else:
            print("  - Missing train.csv or train_images directory.")
    else:
        print("\n[Paddy Disease] Not found at datasets/paddy_disease.")

    print("\nSummary:")
    print("- If you want to train a classifier now, use the PlantVillage dataset:")
    print("    python ml/train_pipeline.py classifier --data_dir datasets/plantvillage --output_dir ml/runs/classifier --backbone mobilenet_v2 --img_size 256 --batch_size 32 --epochs 20 --lr 1e-3 --val_split 0.1 --freeze_epochs 3")
    print("- For severity regression, prepare datasets/severity_regression/images and a labels.csv (filename,severity). The paddy dataset does not contain severity labels.")

if __name__ == '__main__':
    main()
