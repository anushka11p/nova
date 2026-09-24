"""Deduplicate the image dataset and build a leakage-safe train/val/test split.

Near-duplicate photos (burst shots of the same baby) are grouped by perceptual
hash so a group never straddles train and test.
"""
import csv
import hashlib
import os
import random
import sys
from collections import defaultdict

import numpy as np
from PIL import Image

DATA_DIR = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/Downloads/neoBloom/datasets")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "split.csv")
CLASSES = {"normal": 0, "jaundice": 1}
HASH_DIST = 10  # max Hamming distance (of 64 bits) to treat as the same shot
SEED = 42


def dhash(path, size=8):
    img = Image.open(path).convert("L").resize((size + 1, size), Image.LANCZOS)
    a = np.asarray(img, dtype=np.int16)
    return np.packbits((a[:, 1:] > a[:, :-1]).flatten())


def main():
    items, seen = [], set()
    for cls, label in CLASSES.items():
        for f in sorted(os.listdir(os.path.join(DATA_DIR, cls))):
            if not f.lower().endswith((".jpg", ".jpeg", ".png")):
                continue
            p = os.path.join(DATA_DIR, cls, f)
            md5 = hashlib.md5(open(p, "rb").read()).hexdigest()
            if md5 in seen:
                continue
            seen.add(md5)
            items.append({"path": p, "label": label, "hash": dhash(p)})
    print(f"{len(items)} unique images after exact dedupe")

    # union-find over near-duplicate pairs
    parent = list(range(len(items)))

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    hashes = np.unpackbits(np.stack([it["hash"] for it in items]), axis=1)
    for i in range(len(items)):
        d = (hashes[i + 1:] != hashes[i]).sum(1)
        for j in np.nonzero(d <= HASH_DIST)[0]:
            parent[find(i)] = find(i + 1 + j)

    groups = defaultdict(list)
    for i in range(len(items)):
        groups[find(i)].append(i)
    multi = [g for g in groups.values() if len(g) > 1]
    print(f"{len(groups)} groups; {len(multi)} near-duplicate groups covering {sum(map(len, multi))} images")

    # stratified group split 70/15/15, per class by the group's majority label
    rng = random.Random(SEED)
    split_of = {}
    for label in CLASSES.values():
        gs = [g for g in groups.values() if round(np.mean([items[i]["label"] for i in g])) == label]
        rng.shuffle(gs)
        total = sum(map(len, gs))
        acc = 0
        for g in gs:
            frac = acc / total
            s = "train" if frac < 0.70 else "val" if frac < 0.85 else "test"
            for i in g:
                split_of[i] = s
            acc += len(g)

    with open(OUT, "w", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["path", "label", "split"])
        for i, it in enumerate(items):
            w.writerow([it["path"], it["label"], split_of[i]])

    for s in ("train", "val", "test"):
        ls = [items[i]["label"] for i in split_of if split_of[i] == s]
        print(f"{s:5s}: {len(ls):3d} images  (jaundice {sum(ls)}, normal {len(ls) - sum(ls)})")


if __name__ == "__main__":
    main()
