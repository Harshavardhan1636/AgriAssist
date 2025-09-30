import os
import csv
import argparse
import shutil
from pathlib import Path
import xml.etree.ElementTree as ET
from typing import List, Tuple

"""
Build severity_regression dataset from Pascal VOC datasets by converting bounding boxes
into a pixel-area ratio severity label.

Input structure (detected automatically):
  datasets/severity_datasets/<AnyDatasetName>.voc/{train,valid,test}/*.jpg + *.xml

Output structure:
  datasets/severity_regression/
    images/
      <dataset>__<original_filename>.jpg
    labels.csv  # filename,severity  (severity in [0,100])

Usage:
  python ml/prepare_severity_from_voc.py \
    --root datasets/severity_datasets \
    --output datasets/severity_regression \
    --include_sets train valid
"""


def parse_voc_xml(xml_path: Path) -> Tuple[int, int, List[Tuple[int, int, int, int]]]:
    tree = ET.parse(str(xml_path))
    root = tree.getroot()
    size = root.find('size')
    if size is None:
        raise ValueError(f"No <size> in {xml_path}")
    width = int(size.findtext('width', '0'))
    height = int(size.findtext('height', '0'))
    boxes: List[Tuple[int, int, int, int]] = []
    for obj in root.findall('object'):
        bnd = obj.find('bndbox')
        if bnd is None:
            continue
        try:
            xmin = int(float(bnd.findtext('xmin', '0')))
            ymin = int(float(bnd.findtext('ymin', '0')))
            xmax = int(float(bnd.findtext('xmax', '0')))
            ymax = int(float(bnd.findtext('ymax', '0')))
        except Exception:
            continue
        # clip to image bounds
        xmin = max(0, min(xmin, width-1))
        xmax = max(0, min(xmax, width))
        ymin = max(0, min(ymin, height-1))
        ymax = max(0, min(ymax, height))
        if xmax > xmin and ymax > ymin:
            boxes.append((xmin, ymin, xmax, ymax))
    return width, height, boxes


def severity_from_boxes(width: int, height: int, boxes: List[Tuple[int, int, int, int]]) -> float:
    if width <= 0 or height <= 0:
        return 0.0
    img_area = float(width * height)
    diseased = 0.0
    for (xmin, ymin, xmax, ymax) in boxes:
        w = max(0, xmax - xmin)
        h = max(0, ymax - ymin)
        diseased += float(w * h)
    sev = max(0.0, min(100.0, (diseased / img_area) * 100.0))
    return sev


def build_dataset(root: Path, output: Path, include_sets: List[str]):
    images_dir = output / 'images'
    images_dir.mkdir(parents=True, exist_ok=True)
    labels_csv = output / 'labels.csv'

    rows: List[Tuple[str, float]] = []

    # scan all dataset subdirs ending with .voc
    for ds in sorted(root.iterdir()):
        if not ds.is_dir() or not ds.name.endswith('.voc'):
            continue
        ds_name = ds.name.replace(' ', '_')
        for split in include_sets:
            split_dir = ds / split
            if not split_dir.exists():
                continue
            # iterate XML files and find matching jpg
            for xml in sorted(split_dir.glob('*.xml')):
                jpg = xml.with_suffix('.jpg')
                if not jpg.exists():
                    # some datasets might use .jpeg or .png
                    jpeg = xml.with_suffix('.jpeg')
                    png = xml.with_suffix('.png')
                    if jpeg.exists():
                        jpg = jpeg
                    elif png.exists():
                        jpg = png
                    else:
                        continue
                try:
                    width, height, boxes = parse_voc_xml(xml)
                    sev = severity_from_boxes(width, height, boxes)
                except Exception:
                    continue
                out_name = f"{ds_name}__{jpg.name}"
                out_path = images_dir / out_name
                try:
                    shutil.copy2(jpg, out_path)
                except Exception:
                    continue
                rows.append((out_name, sev))

    # write labels.csv
    with open(labels_csv, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['filename', 'severity'])
        for fname, sev in rows:
            w.writerow([fname, f"{sev:.6f}"])

    print(f"Prepared {len(rows)} samples -> {labels_csv}")


def main():
    ap = argparse.ArgumentParser(description='Prepare severity_regression dataset from VOC bounding boxes')
    ap.add_argument('--root', type=str, default='datasets/severity_datasets')
    ap.add_argument('--output', type=str, default='datasets/severity_regression')
    ap.add_argument('--include_sets', type=str, nargs='+', default=['train', 'valid'])
    args = ap.parse_args()

    root = Path(args.root)
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)

    build_dataset(root, output, args.include_sets)


if __name__ == '__main__':
    main()
