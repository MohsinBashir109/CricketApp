from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


def _tight_bbox(mask: np.ndarray) -> tuple[int, int, int, int] | None:
    """Fast bbox for the dominant card-like area (no flood fill)."""
    if mask.sum() == 0:
        return None

    h, w = mask.shape
    row = mask.sum(axis=1).astype(np.float32)
    col = mask.sum(axis=0).astype(np.float32)

    # Use a threshold based on width/height to ignore tiny specks.
    row_thresh = max(8.0, w * 0.12)
    col_thresh = max(8.0, h * 0.12)

    ys = np.where(row > row_thresh)[0]
    xs = np.where(col > col_thresh)[0]
    if ys.size == 0 or xs.size == 0:
        # Fallback to raw bbox.
        ys, xs = np.where(mask)
        if ys.size == 0 or xs.size == 0:
            return None
        return int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())

    return int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())


def remove_background(input_path: Path, output_path: Path) -> None:
    img = Image.open(input_path).convert("RGBA")
    arr = np.array(img).astype(np.float32)
    rgb = arr[..., :3]

    # Heuristic: the card is the largest low-saturation, high-brightness region.
    mx = rgb.max(axis=-1)
    mn = rgb.min(axis=-1)
    sat = (mx - mn) / (mx + 1e-6)
    bright = rgb.mean(axis=-1)

    candidate = (bright > 210) & (sat < 0.22)
    bbox = _tight_bbox(candidate)
    if bbox is None:
        # Fallback: keep everything (no-op).
        output_path.parent.mkdir(parents=True, exist_ok=True)
        img.save(output_path)
        return

    x0, y0, x1, y1 = bbox

    # Add padding to include shadow/rounded edges.
    pad = 8
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(img.width - 1, x1 + pad)
    y1 = min(img.height - 1, y1 + pad)

    crop = img.crop((x0, y0, x1 + 1, y1 + 1))
    crop_arr = np.array(crop).astype(np.float32)
    crop_rgb = crop_arr[..., :3]
    crop_mx = crop_rgb.max(axis=-1)
    crop_mn = crop_rgb.min(axis=-1)
    crop_sat = (crop_mx - crop_mn) / (crop_mx + 1e-6)
    crop_bright = crop_rgb.mean(axis=-1)

    # Recompute mask on crop for tighter edges.
    crop_candidate = (crop_bright > 205) & (crop_sat < 0.25)
    crop_bbox = _tight_bbox(crop_candidate)
    if crop_bbox is None:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        crop.save(output_path)
        return

    cx0, cy0, cx1, cy1 = crop_bbox
    # Build a rectangular mask (fast, good enough for UI card screenshots).
    crop_mask = np.zeros((crop.height, crop.width), dtype=np.uint8)
    crop_mask[cy0 : cy1 + 1, cx0 : cx1 + 1] = 255

    # Feather edges slightly, then composite over off-white background.
    alpha_img = Image.fromarray(crop_mask).convert("L").filter(
        ImageFilter.GaussianBlur(radius=1.2)
    )
    crop.putalpha(alpha_img)

    # Off-white background (warm).
    offwhite = (255, 252, 246, 255)
    bg = Image.new("RGBA", crop.size, offwhite)
    out = Image.alpha_composite(bg, crop)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    out.save(output_path)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    remove_background(Path(args.input), Path(args.output))


if __name__ == "__main__":
    main()

