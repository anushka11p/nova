"""Evaluate the EfficientNetV2B0 model trained on Kaggle (notebook1d58632c68.ipynb) on the notebook's own split.

Rebuilds the notebook's exact 70/15/15 stratified split (same sorted file lists, random_state=42), reproduces
its test metrics at 0.5, picks Nova's screening threshold on the validation set, and writes model_metrics.json.
"""
import glob, json, os, sys
import numpy as np, pandas as pd, tensorflow as tf
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import train_test_split

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL = os.path.join(HERE, 'received', 'jaundice_efficientnetv2b0.keras')
DATA = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser('~/Downloads/neoBloom/datasets')
TARGET_SENSITIVITY = 0.90

def get_images(folder):
    files = []
    for ext in ['*.jpg', '*.jpeg', '*.png', '*.JPG', '*.JPEG', '*.PNG']:
        files.extend(glob.glob(os.path.join(folder, ext)))
    return sorted(files)

normal, jaundice = get_images(os.path.join(DATA, 'normal')), get_images(os.path.join(DATA, 'jaundice'))
df = pd.DataFrame([{'filepath': p, 'label': 0} for p in normal] + [{'filepath': p, 'label': 1} for p in jaundice])
train_df, temp_df = train_test_split(df, test_size=0.30, stratify=df['label'], random_state=42)
val_df, test_df = train_test_split(temp_df, test_size=0.50, stratify=temp_df['label'], random_state=42)

def load(path):
    img = tf.image.decode_jpeg(tf.io.read_file(path), channels=3)
    return tf.cast(tf.image.resize(img, (224, 224)), tf.float32)

model = tf.keras.models.load_model(MODEL)
def probs(d):
    x = np.stack([load(p).numpy() for p in d['filepath']])
    return d['label'].values.astype(int), model.predict(x, batch_size=32, verbose=0).ravel()

def metrics(y, p, t):
    pred = (p >= t).astype(int)
    tn, fp, fn, tp = confusion_matrix(y, pred, labels=[0, 1]).ravel()
    return {'threshold': round(float(t), 2), 'accuracy': round(accuracy_score(y, pred), 4),
            'precision': round(precision_score(y, pred, zero_division=0), 4), 'sensitivity': round(recall_score(y, pred), 4),
            'specificity': round(tn / (tn + fp), 4), 'f1': round(f1_score(y, pred), 4), 'auc': round(float(roc_auc_score(y, p)), 4),
            'confusion': {'tp': int(tp), 'fn': int(fn), 'fp': int(fp), 'tn': int(tn)}, 'n': int(len(y))}

def pick_threshold(y, p):
    best = 0.5
    for t in np.linspace(0.05, 0.95, 91):
        if ((p >= t) & (y == 1)).sum() / max(1, (y == 1).sum()) >= TARGET_SENSITIVITY:
            best = float(t)
    return round(best, 2)

y_val, p_val = probs(val_df)
y_test, p_test = probs(test_df)
t = pick_threshold(y_val, p_val)
report = {
    'model': 'Nova Jaundice EfficientNetV2B0 v4.0',
    'source': 'Trained on Kaggle with notebook1d58632c68.ipynb; evaluated locally by ml/efficientnetv2/evaluate_received.py',
    'input': {'shape': [1, 224, 224, 3], 'dtype': 'float32', 'range': '0-255 RGB'},
    'output': 'probability of jaundice',
    'threshold': t,
    'threshold_policy': 'highest threshold reaching >= 90% sensitivity on the validation set',
    'val': metrics(y_val, p_val, t),
    'test': metrics(y_test, p_test, t),
    'test_at_0.5': metrics(y_test, p_test, 0.5),
    'split_sizes': {'train': len(train_df), 'val': len(val_df), 'test': len(test_df)},
}
json.dump(report, open(os.path.join(HERE, 'model_metrics_v2.json'), 'w'), indent=2)
print(json.dumps({k: report[k] for k in ('threshold', 'test_at_0.5', 'test', 'val')}, indent=1))
