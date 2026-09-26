"""Local port of notebook1d58632c68.ipynb: EfficientNetV2B0 jaundice classifier.

The dataset handling, 70/15/15 stratified split, augmentation, architecture, two-stage training,
callbacks and class weights are the notebook's. Changes (marked `# CHANGED:`):
  1. Kaggle paths -> local dataset folder; outputs -> ml/efficientnetv2/outputs/.
  2. MirroredStrategy / mixed_float16 only when a GPU is present (the notebook ran on 2x T4;
     on CPU mixed precision is slow and gives the same model).
  3. Plots saved to files instead of plt.show().
  4. Added: specificity + confusion matrix, a screening threshold chosen on the validation set
     (Nova's policy: catch >= 90% of jaundice), and export in Nova's formats
     (.keras for the web backend, .tflite for the mobile app, model_metrics.json).

Model contract (same as Nova's previous model, so the backend and apps need no changes):
  input  float32 [1, 224, 224, 3], raw RGB 0..255 (EfficientNetV2 include_preprocessing=True)
  output float32 [1, 1], probability of jaundice (label 1 = Jaundice)

Run:  ml/.venv/bin/python ml/efficientnetv2/train_v2.py [--data DIR] [--install]
"""
import argparse
import glob
import json
import os
import shutil
import time

import matplotlib
matplotlib.use('Agg')  # CHANGED: headless
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
import tensorflow as tf
from sklearn.metrics import (accuracy_score, classification_report, confusion_matrix, f1_score,
                             precision_score, recall_score, roc_auc_score, roc_curve)
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight
from tensorflow import keras
from tensorflow.keras import layers, mixed_precision

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(HERE, 'outputs')
PLOTS = os.path.join(OUT, 'plots')
TARGET_SENSITIVITY = 0.90

ap = argparse.ArgumentParser()
ap.add_argument('--data', default=os.path.expanduser('~/Downloads/neoBloom/datasets'))
ap.add_argument('--install', action='store_true', help='also install the model into Nova (backs up the current one)')
args = ap.parse_args()
os.makedirs(PLOTS, exist_ok=True)
tf.keras.utils.set_random_seed(42)


def save_fig(name):
    plt.savefig(os.path.join(PLOTS, name), dpi=120, bbox_inches='tight')
    plt.close()


# -------------------------------------------------- GPU / precision / strategy
gpus = tf.config.list_physical_devices('GPU')
print('TensorFlow', tf.__version__, '| GPUs:', len(gpus))
if gpus:  # CHANGED: notebook always enabled these (2x T4 on Kaggle)
    mixed_precision.set_global_policy('mixed_float16')
    strategy = tf.distribute.MirroredStrategy()
else:
    strategy = tf.distribute.get_strategy()
print('Precision policy:', mixed_precision.global_policy())

# -------------------------------------------------- dataset
DATASET_PATH = args.data  # CHANGED: was /kaggle/input/datasets/aiolapo/jaundice-image-data
NORMAL_DIR = os.path.join(DATASET_PATH, 'normal')
JAUNDICE_DIR = os.path.join(DATASET_PATH, 'jaundice')
for d in (DATASET_PATH, NORMAL_DIR, JAUNDICE_DIR):
    if not os.path.exists(d):
        raise FileNotFoundError(f'Not found: {d}')


def get_images(folder):
    files = []
    for ext in ['*.jpg', '*.jpeg', '*.png', '*.JPG', '*.JPEG', '*.PNG']:
        files.extend(glob.glob(os.path.join(folder, ext)))
    return sorted(files)


normal_images = get_images(NORMAL_DIR)
jaundice_images = get_images(JAUNDICE_DIR)
df = pd.DataFrame(
    [{'filepath': p, 'label': 0, 'class': 'Normal'} for p in normal_images]
    + [{'filepath': p, 'label': 1, 'class': 'Jaundice'} for p in jaundice_images]
)
print(f'Normal {len(normal_images)} | Jaundice {len(jaundice_images)} | Total {len(df)}')

plt.figure(figsize=(7, 5))
sns.countplot(data=df, x='class')
plt.title('Jaundice Dataset - Class Distribution')
save_fig('class_distribution.png')

# 70 / 15 / 15 stratified
train_df, temp_df = train_test_split(df, test_size=0.30, stratify=df['label'], random_state=42)
val_df, test_df = train_test_split(temp_df, test_size=0.50, stratify=temp_df['label'], random_state=42)
for name, d in (('train', train_df), ('val', val_df), ('test', test_df)):
    print(f'{name:5s} {len(d):4d}  jaundice {int(d.label.sum()):3d}  normal {int((d.label == 0).sum()):3d}')

IMG_SIZE = (224, 224)
BATCH_SIZE = 64
AUTOTUNE = tf.data.AUTOTUNE


def load_image(filepath, label):
    image = tf.io.read_file(filepath)
    image = tf.image.decode_jpeg(image, channels=3)
    image = tf.image.resize(image, IMG_SIZE)
    image = tf.cast(image, tf.float32)
    return image, tf.cast(label, tf.float32)


def create_dataset(dataframe, shuffle=False):
    ds = tf.data.Dataset.from_tensor_slices((dataframe['filepath'].values, dataframe['label'].values.astype(np.float32)))
    if shuffle:
        ds = ds.shuffle(buffer_size=len(dataframe), seed=42, reshuffle_each_iteration=True)
    ds = ds.map(load_image, num_parallel_calls=AUTOTUNE)
    return ds.batch(BATCH_SIZE, drop_remainder=False).prefetch(AUTOTUNE)


train_ds = create_dataset(train_df, shuffle=True)
val_ds = create_dataset(val_df)
test_ds = create_dataset(test_df)

classes = np.unique(train_df['label'])
weights = compute_class_weight(class_weight='balanced', classes=classes, y=train_df['label'])
class_weights = {int(c): float(w) for c, w in zip(classes, weights)}
print('Class weights:', class_weights)

# -------------------------------------------------- model
data_augmentation = keras.Sequential([
    layers.RandomFlip('horizontal'),
    layers.RandomRotation(0.05),
    layers.RandomZoom(0.10),
    layers.RandomContrast(0.10),
], name='data_augmentation')

with strategy.scope():
    base_model = tf.keras.applications.EfficientNetV2B0(
        include_top=False, weights='imagenet', input_shape=(224, 224, 3), include_preprocessing=True)
    base_model.trainable = False
    inputs = keras.Input(shape=(224, 224, 3), name='image')
    x = data_augmentation(inputs)
    x = base_model(x, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.35)(x)
    x = layers.Dense(128, activation='relu')(x)
    x = layers.Dropout(0.25)(x)
    outputs = layers.Dense(1, activation='sigmoid', dtype='float32', name='prediction')(x)
    model = keras.Model(inputs, outputs, name='Jaundice_EfficientNetV2B0')


def compile_model(lr):
    with strategy.scope():
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=lr),
            loss='binary_crossentropy',
            metrics=[keras.metrics.BinaryAccuracy(name='accuracy'), keras.metrics.Precision(name='precision'),
                     keras.metrics.Recall(name='recall'), keras.metrics.AUC(name='auc')])


BEST_PATH = os.path.join(OUT, 'best_jaundice_model.keras')  # CHANGED: was /kaggle/working/
checkpoint = keras.callbacks.ModelCheckpoint(BEST_PATH, monitor='val_auc', mode='max', save_best_only=True, verbose=1)
early_stopping = keras.callbacks.EarlyStopping(monitor='val_auc', mode='max', patience=5, restore_best_weights=True, verbose=1)
reduce_lr = keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.2, patience=2, min_lr=1e-7, verbose=1)

# Stage 1: frozen backbone
compile_model(1e-3)
t0 = time.time()
history = model.fit(train_ds, validation_data=val_ds, epochs=15, class_weight=class_weights,
                    callbacks=[checkpoint, early_stopping, reduce_lr], verbose=2)
stage1 = time.time() - t0
print(f'Stage 1: {stage1 / 60:.1f} min')

# Stage 2: unfreeze the last 30 backbone layers
with strategy.scope():
    base_model.trainable = True
    for layer in base_model.layers[:-30]:
        layer.trainable = False
print('Base layers:', len(base_model.layers), '| trainable:', sum(l.trainable for l in base_model.layers))
compile_model(1e-5)
t0 = time.time()
fine_history = model.fit(train_ds, validation_data=val_ds, epochs=15, class_weight=class_weights,
                         callbacks=[checkpoint, early_stopping, reduce_lr], verbose=2)
stage2 = time.time() - t0
print(f'Stage 2: {stage2 / 60:.1f} min')

for key, title in (('accuracy', 'Accuracy'), ('loss', 'Loss')):
    h = pd.concat([pd.DataFrame(history.history), pd.DataFrame(fine_history.history)], ignore_index=True)
    plt.figure(figsize=(10, 5))
    plt.plot(h[key], label='Training')
    plt.plot(h[f'val_{key}'], label='Validation')
    plt.axvline(len(history.history[key]) - 0.5, color='grey', linestyle='--', label='fine-tuning starts')
    plt.xlabel('Epoch')
    plt.ylabel(title)
    plt.title(f'EfficientNetV2B0 - {title}')
    plt.legend()
    save_fig(f'curves_{key}.png')

# -------------------------------------------------- evaluate the best checkpoint (as the notebook does)
model = keras.models.load_model(BEST_PATH)


def probs(ds):
    y, p = [], []
    for images, labels in ds:
        p.extend(model.predict(images, verbose=0).ravel())
        y.extend(labels.numpy().astype(int))
    return np.array(y), np.array(p)


def metrics(y, p, t):
    pred = (p >= t).astype(int)
    tn, fp, fn, tp = confusion_matrix(y, pred, labels=[0, 1]).ravel()
    return {
        'threshold': round(float(t), 2),
        'accuracy': round(accuracy_score(y, pred), 4),
        'precision': round(precision_score(y, pred, zero_division=0), 4),
        'sensitivity': round(recall_score(y, pred, zero_division=0), 4),
        'specificity': round(tn / (tn + fp), 4),
        'f1': round(f1_score(y, pred, zero_division=0), 4),
        'auc': round(float(roc_auc_score(y, p)), 4),
        'confusion': {'tp': int(tp), 'fn': int(fn), 'fp': int(fp), 'tn': int(tn)},
        'n': int(len(y)),
    }


def pick_threshold(y, p):
    """Highest threshold that still catches TARGET_SENSITIVITY of jaundice on validation data."""
    best = 0.5
    for t in np.linspace(0.05, 0.95, 91):
        if ((p >= t) & (y == 1)).sum() / max(1, (y == 1).sum()) >= TARGET_SENSITIVITY:
            best = float(t)
    return round(best, 2)


y_val, p_val = probs(val_ds)
y_test, p_test = probs(test_ds)
screen_t = pick_threshold(y_val, p_val)

at_05 = metrics(y_test, p_test, 0.5)
at_screen = metrics(y_test, p_test, screen_t)
print('\nNotebook rule (0.5) on test:', json.dumps(at_05))
print(classification_report(y_test, (p_test >= 0.5).astype(int), target_names=['Normal', 'Jaundice'], zero_division=0))
print(f'Screening threshold {screen_t} (chosen on validation) on test:', json.dumps(at_screen))

for t, tag in ((0.5, '0.5'), (screen_t, 'screening')):
    plt.figure(figsize=(7, 6))
    sns.heatmap(confusion_matrix(y_test, (p_test >= t).astype(int)), annot=True, fmt='d',
                xticklabels=['Normal', 'Jaundice'], yticklabels=['Normal', 'Jaundice'])
    plt.xlabel('Predicted')
    plt.ylabel('Actual')
    plt.title(f'Confusion matrix (threshold {t})')
    save_fig(f'confusion_{tag}.png')
fpr, tpr, _ = roc_curve(y_test, p_test)
plt.figure(figsize=(8, 6))
plt.plot(fpr, tpr, label=f'EfficientNetV2B0 (AUC = {at_05["auc"]:.4f})')
plt.plot([0, 1], [0, 1], linestyle='--')
plt.xlabel('False Positive Rate')
plt.ylabel('True Positive Rate')
plt.title('ROC Curve - Jaundice Detection')
plt.legend()
save_fig('roc.png')

# -------------------------------------------------- export in Nova's formats
FINAL = os.path.join(OUT, 'jaundice_efficientnetv2b0.keras')
model.save(FINAL)
report = {
    'model': 'Nova Jaundice EfficientNetV2B0 v4.0',
    'source': 'notebook1d58632c68.ipynb (EfficientNetV2B0), ported in ml/efficientnetv2/train_v2.py',
    'input': {'shape': [1, 224, 224, 3], 'dtype': 'float32', 'range': '0-255 RGB'},
    'output': 'probability of jaundice',
    'threshold': screen_t,
    'threshold_policy': f'highest threshold reaching >= {TARGET_SENSITIVITY:.0%} sensitivity on validation',
    'val': metrics(y_val, p_val, screen_t),
    'test': at_screen,
    'test_at_0.5': at_05,
    'split_sizes': {'train': len(train_df), 'val': len(val_df), 'test': len(test_df)},
    'train_minutes': round((stage1 + stage2) / 60, 1),
}
json.dump(report, open(os.path.join(OUT, 'model_metrics.json'), 'w'), indent=2)

conv = tf.lite.TFLiteConverter.from_keras_model(model)
conv.optimizations = [tf.lite.Optimize.DEFAULT]
conv.target_spec.supported_types = [tf.float16]
tflite = conv.convert()
open(os.path.join(OUT, 'nova_jaundice.tflite'), 'wb').write(tflite)
interp = tf.lite.Interpreter(model_content=tflite)
interp.allocate_tensors()
i_in, i_out = interp.get_input_details()[0]['index'], interp.get_output_details()[0]['index']
diffs = []
for (x, _), pk in zip(test_ds.unbatch().batch(1), p_test):
    interp.set_tensor(i_in, x.numpy().astype(np.float32))
    interp.invoke()
    diffs.append(abs(float(interp.get_tensor(i_out)[0][0]) - pk))
print(f'TFLite vs Keras max |diff| on test: {max(diffs):.4f} ({len(tflite) / 1e6:.1f} MB)')

if args.install:
    backup = os.path.join(ROOT, 'models_backup', 'efficientnetb0_v3')
    os.makedirs(backup, exist_ok=True)
    for src in ('nova_jaundice.keras', 'model_metrics.json', 'mobile/assets/model/nova_jaundice.tflite'):
        if os.path.exists(os.path.join(ROOT, src)):
            shutil.copy2(os.path.join(ROOT, src), os.path.join(backup, os.path.basename(src)))
    shutil.copy2(FINAL, os.path.join(ROOT, 'nova_jaundice.keras'))
    shutil.copy2(os.path.join(OUT, 'model_metrics.json'), os.path.join(ROOT, 'model_metrics.json'))
    shutil.copy2(os.path.join(OUT, 'model_metrics.json'), os.path.join(ROOT, 'mobile/assets/model/model_metrics.json'))
    shutil.copy2(os.path.join(OUT, 'nova_jaundice.tflite'), os.path.join(ROOT, 'mobile/assets/model/nova_jaundice.tflite'))
    print(f'Installed into Nova; previous model backed up to {backup}')
