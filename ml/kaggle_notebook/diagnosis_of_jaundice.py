"""Faithful local port of the Kaggle notebook "Diagnosis of jaundice" (snmahsa, version 2 of 3).

Source: https://www.kaggle.com/code/snmahsa/diagnosis-of-jaundice
Original code, as extracted from the published notebook: notebook_code.txt (same folder).

The architectures, epochs, optimisers, augmentation and preprocessing are the notebook's.
Every departure from the original is marked `# CHANGED:` with the reason. In summary:
  1. Kaggle input paths -> local dataset folder.
  2. Split bug fix: the notebook never shuffles its DataFrame (all jaundice rows, then all normal),
     so Keras' validation_split took the LAST 20% = 152 normal-only images and every deep-model
     validation score was meaningless. Here one seed-42 80/20 split (the notebook's own
     train_test_split(test_size=0.2, random_state=42), applied to the same load order) is shared
     by ALL models, so every model is scored on the same 152 held-out images.
  3. plt.show() -> plots saved to outputs/plots/.
  4. The unused `transformers` ViT import is dropped (never referenced in the notebook).
  5. Trained models are saved, and every model is evaluated with the same full metric set.
  6. Directory listings are sorted so the run is reproducible (os.listdir order is unspecified).

Run:  ml/.venv/bin/python ml/kaggle_notebook/diagnosis_of_jaundice.py [--data DIR]
"""
import argparse
import json
import os
import random
import time

import matplotlib
matplotlib.use('Agg')  # CHANGED: headless; figures are saved instead of shown
import cv2
import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
import tensorflow as tf
import xgboost as xgb
from PIL import Image
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.metrics import (accuracy_score, auc, classification_report, confusion_matrix, f1_score,
                             precision_score, recall_score, roc_auc_score, roc_curve)
from sklearn.model_selection import cross_val_score, train_test_split
from tensorflow.keras.applications import EfficientNetB0, ResNet50
from tensorflow.keras.layers import Dense, Flatten, GlobalAveragePooling2D
from tensorflow.keras.models import Model, Sequential
from tensorflow.keras.preprocessing.image import ImageDataGenerator
# CHANGED: `from transformers import ViTModel, ViTConfig` removed; the notebook never uses it.

import warnings
warnings.filterwarnings('ignore')

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'outputs')
MODELS = os.path.join(OUT, 'models')
PLOTS = os.path.join(OUT, 'plots')
SEED = 42

ap = argparse.ArgumentParser()
ap.add_argument('--data', default=os.path.expanduser('~/Downloads/neoBloom/datasets'),
                help='folder containing jaundice/ and normal/ (Kaggle: /kaggle/input/jaundice-image-data)')
args = ap.parse_args()
os.makedirs(MODELS, exist_ok=True)
os.makedirs(PLOTS, exist_ok=True)

# CHANGED: seeds fixed so the run is repeatable (the notebook sets none)
random.seed(SEED)
np.random.seed(SEED)
tf.keras.utils.set_random_seed(SEED)


def save_fig(name):
    plt.savefig(os.path.join(PLOTS, name), dpi=120, bbox_inches='tight')
    plt.close()


def listdir_sorted(d):
    return sorted(os.listdir(d))  # CHANGED: deterministic order


# ---------------------------------------------------------------- Load and explore the dataset
# CHANGED: Kaggle paths -> local folder
jaundice_dir = os.path.join(args.data, 'jaundice')
normal_dir = os.path.join(args.data, 'normal')

jaundice_images = [os.path.join(jaundice_dir, img) for img in listdir_sorted(jaundice_dir)]
normal_images = [os.path.join(normal_dir, img) for img in listdir_sorted(normal_dir)]

images = jaundice_images + normal_images
labels = ['jaundice'] * len(jaundice_images) + ['normal'] * len(normal_images)
data = pd.DataFrame({'image_path': images, 'label': labels})
print(f"Dataset: {len(data)} images | jaundice {len(jaundice_images)} | normal {len(normal_images)}")

sns.countplot(x='label', data=data)
plt.title('Distribution of Labels')
save_fig('01_label_distribution.png')

# CHANGED: the shared seed-42 80/20 split (see module docstring). The notebook's classical models use
# exactly this call on this load order; the deep models now use the same held-out images.
all_idx = np.arange(len(data))
train_idx, test_idx = train_test_split(all_idx, test_size=0.2, random_state=SEED)
train_df = data.iloc[train_idx].reset_index(drop=True)
test_df = data.iloc[test_idx].reset_index(drop=True)
print(f"Split: train {len(train_df)} ({(train_df.label == 'jaundice').sum()} jaundice) | "
      f"held-out {len(test_df)} ({(test_df.label == 'jaundice').sum()} jaundice)")

# ---------------------------------------------------------------- Preprocessing and data augmentation
datagen = ImageDataGenerator(
    rescale=1./255,
    # CHANGED: validation_split=0.2 removed; the split is made explicitly above
    horizontal_flip=True,
    zoom_range=0.2,
    shear_range=0.2
)

train_generator = datagen.flow_from_dataframe(
    train_df,  # CHANGED: was `data` with subset='training'
    x_col='image_path',
    y_col='label',
    target_size=(224, 224),
    batch_size=32,
    class_mode='binary',
    seed=SEED,
)

# As in the notebook, validation batches come from the same (augmenting) generator.
validation_generator = datagen.flow_from_dataframe(
    test_df,  # CHANGED: was `data` with subset='validation'
    x_col='image_path',
    y_col='label',
    target_size=(224, 224),
    batch_size=32,
    class_mode='binary',
    seed=SEED,
)

# CHANGED (evaluation only): a non-augmenting, unshuffled view of the held-out images for scoring
eval_generator = ImageDataGenerator(rescale=1./255).flow_from_dataframe(
    test_df, x_col='image_path', y_col='label', target_size=(224, 224),
    batch_size=32, class_mode='binary', shuffle=False,
)
CLASS_INDICES = train_generator.class_indices  # {'jaundice': 0, 'normal': 1}: sigmoid output = P(normal)
print('Keras class indices:', CLASS_INDICES)

# ---------------------------------------------------------------- Visualisation
def visualize_images(images, title, fname, rows=2, cols=5):
    fig, axes = plt.subplots(rows, cols, figsize=(15, 6))
    fig.suptitle(title, fontsize=16)
    for i, img_path in enumerate(images[:rows * cols]):
        ax = axes[i // cols, i % cols]
        ax.imshow(Image.open(img_path))
        ax.axis('off')
    save_fig(fname)


visualize_images(jaundice_images, 'Jaundice Images', '02_jaundice_samples.png')
visualize_images(normal_images, 'Normal Images', '03_normal_samples.png')


def plot_image_histogram(image_path, title, fname):
    img_array = np.array(Image.open(image_path))
    plt.figure(figsize=(10, 4))
    plt.hist(img_array.ravel(), bins=256, color='orange', alpha=0.5, rwidth=0.8)
    plt.title(title)
    plt.xlabel('Pixel Intensity')
    plt.ylabel('Frequency')
    save_fig(fname)


plot_image_histogram(jaundice_images[0], 'Histogram of a Jaundice Image', '04_hist_jaundice.png')
plot_image_histogram(normal_images[0], 'Histogram of a Normal Image', '05_hist_normal.png')

# ---------------------------------------------------------------- Shared evaluation (CHANGED: added)
RESULTS = {}


def evaluate(name, y_true, p_jaundice, threshold=0.5):
    """Jaundice is the positive class. Same 0.5 decision rule the notebook uses."""
    y_pred = (p_jaundice >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()
    r = {
        'accuracy': accuracy_score(y_true, y_pred),
        'precision': precision_score(y_true, y_pred, zero_division=0),
        'recall_sensitivity': recall_score(y_true, y_pred, zero_division=0),
        'specificity': tn / (tn + fp) if (tn + fp) else 0.0,
        'f1': f1_score(y_true, y_pred, zero_division=0),
        'roc_auc': roc_auc_score(y_true, p_jaundice),
        'confusion_matrix': {'tn': int(tn), 'fp': int(fp), 'fn': int(fn), 'tp': int(tp)},
        'n_test': int(len(y_true)),
    }
    r = {k: (round(float(v), 4) if isinstance(v, (float, np.floating)) else v) for k, v in r.items()}
    RESULTS[name] = r
    print(f"\n=== {name} (held-out {len(y_true)}) ===")
    print(classification_report(y_true, y_pred, target_names=['Normal', 'Jaundice'], zero_division=0))
    print(json.dumps(r))

    plt.figure(figsize=(6, 5))
    sns.heatmap(confusion_matrix(y_true, y_pred), annot=True, fmt='d', cmap='bone',
                xticklabels=['Normal', 'Jaundice'], yticklabels=['Normal', 'Jaundice'])
    plt.title(f'Confusion Matrix: {name}')
    plt.xlabel('Predicted')
    plt.ylabel('Actual')
    save_fig(f'cm_{name}.png')
    return r


def deep_eval(name, model, history):
    model.save(os.path.join(MODELS, f'{name}.keras'))
    p_normal = model.predict(eval_generator, verbose=0).ravel()
    y_true = (eval_generator.classes == np.array(CLASS_INDICES['jaundice'])).astype(int)  # 1 = jaundice
    ROC_INPUTS[name] = (y_true, 1 - p_normal)
    evaluate(name, y_true, 1 - p_normal)
    RESULTS[name]['history'] = {k: [round(float(x), 4) for x in v] for k, v in history.history.items()}
    pd.DataFrame(history.history).plot(figsize=(8, 4), title=f'Training curves: {name}')
    save_fig(f'curves_{name}.png')


ROC_INPUTS = {}
timings = {}

# ---------------------------------------------------------------- 1. Convolutional Neural Network
t0 = time.time()
cnn_model = Sequential([
    tf.keras.layers.Conv2D(32, (3, 3), activation='relu', input_shape=(224, 224, 3)),
    tf.keras.layers.MaxPooling2D(2, 2),
    tf.keras.layers.Conv2D(64, (3, 3), activation='relu'),
    tf.keras.layers.MaxPooling2D(2, 2),
    tf.keras.layers.Flatten(),
    tf.keras.layers.Dense(128, activation='relu'),
    tf.keras.layers.Dense(1, activation='sigmoid')
])
cnn_model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
cnn_history = cnn_model.fit(train_generator, validation_data=validation_generator, epochs=20, verbose=2)
deep_eval('cnn', cnn_model, cnn_history)
timings['cnn'] = time.time() - t0

# ---------------------------------------------------------------- 2. "EfficientDet" (EfficientNetB0 + Flatten, fully trainable)
t0 = time.time()
efficient_model = EfficientNetB0(input_shape=(224, 224, 3), include_top=False, weights='imagenet')
x = Flatten()(efficient_model.output)
output = Dense(1, activation='sigmoid')(x)
efficient_model = Model(inputs=efficient_model.input, outputs=output)
efficient_model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
efficient_history = efficient_model.fit(train_generator, validation_data=validation_generator, epochs=10, verbose=2)
deep_eval('efficientnet_flatten', efficient_model, efficient_history)
timings['efficientnet_flatten'] = time.time() - t0

# ---------------------------------------------------------------- 3. ResNet50 (frozen) + Dense 1024
t0 = time.time()
base_model = ResNet50(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
x = GlobalAveragePooling2D()(base_model.output)
x = Dense(1024, activation='relu')(x)
predictions = Dense(1, activation='sigmoid')(x)
model = Model(inputs=base_model.input, outputs=predictions)
for layer in base_model.layers:
    layer.trainable = False
model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
history = model.fit(train_generator, validation_data=validation_generator, epochs=10, verbose=2)
deep_eval('resnet50', model, history)
timings['resnet50'] = time.time() - t0

# ---------------------------------------------------------------- 4. EfficientNetB0 (frozen) + Dense 1024
t0 = time.time()
base_model = EfficientNetB0(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
x = GlobalAveragePooling2D()(base_model.output)
x = Dense(1024, activation='relu')(x)
predictions = Dense(1, activation='sigmoid')(x)
model = Model(inputs=base_model.input, outputs=predictions)
for layer in base_model.layers:
    layer.trainable = False
model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
history = model.fit(train_generator, validation_data=validation_generator, epochs=10, verbose=2)
deep_eval('efficientnet_frozen', model, history)
timings['efficientnet_frozen'] = time.time() - t0


# ---------------------------------------------------------------- Classical: 64x64 grayscale, flattened
def load_images(jaundice_dir, normal_dir):
    images, labels = [], []
    for dir_path, label in [(jaundice_dir, 'Jaundice'), (normal_dir, 'Normal')]:
        for filename in listdir_sorted(dir_path):
            image = cv2.imread(os.path.join(dir_path, filename), cv2.IMREAD_GRAYSCALE)
            if image is not None:
                images.append(cv2.resize(image, (64, 64)))
                labels.append(label)
            else:
                print(f"Failed to read image: {filename}")
    images, labels = np.array(images), np.array(labels)
    print(f"Loaded {len(images)} images with labels.")
    return images, labels


images, labels = load_images(jaundice_dir, normal_dir)
n_samples = images.shape[0]
images_flattened = images.reshape(n_samples, -1)
print(f"Images flattened to shape: {images_flattened.shape}")


def encode_labels(labels):
    return np.where(labels == 'Jaundice', 1, 0)


encoded_labels = encode_labels(labels)
assert len(images_flattened) == len(data), 'classical loader must see the same images as the deep pipeline'
X_train, X_test, y_train, y_test = train_test_split(images_flattened, encoded_labels, test_size=0.2, random_state=42)
assert (y_test == (test_df.label == 'jaundice').astype(int).values).all(), 'shared split mismatch'

# ---------------------------------------------------------------- 5. XGBoost
t0 = time.time()
xgboost_model = xgb.XGBClassifier(eval_metric='logloss')  # CHANGED: `use_label_encoder=False` removed (dropped in XGBoost 2+)
xgboost_model.fit(X_train, y_train)
xgb_prob = xgboost_model.predict_proba(X_test)[:, 1]
ROC_INPUTS['xgboost'] = (y_test, xgb_prob)
evaluate('xgboost', y_test, xgb_prob)
xgboost_model.save_model(os.path.join(MODELS, 'xgboost.json'))
timings['xgboost'] = time.time() - t0

importances = pd.DataFrame({'Feature': np.arange(images_flattened.shape[1]), 'Importance': xgboost_model.feature_importances_})
importances = importances.sort_values(by='Importance', ascending=False)
print("Top features (XGBoost):\n", importances.head(10))
plt.figure(figsize=(12, 8))
sns.barplot(x='Importance', y='Feature', data=importances.head(20), orient='h')
plt.title('Top 20 Feature Importances for XGBoost Model')
save_fig('xgboost_feature_importance.png')

# ---------------------------------------------------------------- 6. Random Forest
t0 = time.time()
rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
rf_model.fit(X_train, y_train)
rf_prob = rf_model.predict_proba(X_test)[:, 1]
ROC_INPUTS['random_forest'] = (y_test, rf_prob)
evaluate('random_forest', y_test, rf_prob)
joblib.dump(rf_model, os.path.join(MODELS, 'random_forest.joblib'))
timings['random_forest'] = time.time() - t0

importances = pd.DataFrame({'Feature': np.arange(X_train.shape[1]), 'Importance': rf_model.feature_importances_})
importances = importances.sort_values(by='Importance', ascending=False)
plt.figure(figsize=(12, 8))
sns.barplot(x='Importance', y='Feature', data=importances.head(20), orient='h')
plt.title('Top 20 Feature Importances for Random Forest Model')
save_fig('random_forest_feature_importance.png')

# Cross-validation (as in the notebook: on all images, 5 folds)
cv_scores = cross_val_score(rf_model, images_flattened, encoded_labels, cv=5)
print("Cross-validation scores: ", cv_scores)
print("Mean cross-validation score: ", cv_scores.mean())
RESULTS['random_forest']['cv5_accuracy'] = [round(float(s), 4) for s in cv_scores]
RESULTS['random_forest']['cv5_mean'] = round(float(cv_scores.mean()), 4)

# ---------------------------------------------------------------- 7. Ensemble (soft voting RF + XGBoost)
t0 = time.time()
model1 = RandomForestClassifier(n_estimators=100, random_state=42)
model2 = xgb.XGBClassifier(eval_metric='logloss')  # CHANGED: `use_label_encoder=False` removed
voting_clf = VotingClassifier(estimators=[('rf', model1), ('xgb', model2)], voting='soft')
voting_clf.fit(X_train, y_train)
vote_prob = voting_clf.predict_proba(X_test)[:, 1]
ROC_INPUTS['voting_ensemble'] = (y_test, vote_prob)
evaluate('voting_ensemble', y_test, vote_prob)
joblib.dump(voting_clf, os.path.join(MODELS, 'voting_ensemble.joblib'))
timings['voting_ensemble'] = time.time() - t0

# ---------------------------------------------------------------- Comparison plots
plt.figure(figsize=(10, 8))
for name, (yt, pr) in ROC_INPUTS.items():
    fpr, tpr, _ = roc_curve(yt, pr)
    plt.plot(fpr, tpr, lw=2, label=f'{name} (AUC = {auc(fpr, tpr):.2f})')
plt.plot([0, 1], [0, 1], color='grey', linestyle='--')
plt.title('ROC Curve Comparison (held-out set)')
plt.xlabel('False Positive Rate')
plt.ylabel('True Positive Rate')
plt.legend(loc='lower right')
plt.grid(True)
save_fig('roc_comparison.png')

names = list(RESULTS)
plt.figure(figsize=(10, 5))
plt.bar(names, [RESULTS[n]['accuracy'] for n in names])
plt.xticks(rotation=30, ha='right')
plt.ylim(0, 1)
plt.title('Model Accuracy Comparison (held-out set)')
save_fig('accuracy_comparison.png')

# ---------------------------------------------------------------- Save everything
best = max(names, key=lambda n: (RESULTS[n]['roc_auc'], RESULTS[n]['f1']))
summary = {
    'source': 'https://www.kaggle.com/code/snmahsa/diagnosis-of-jaundice (version 2), ported with the changes listed in diagnosis_of_jaundice.py',
    'dataset': {
        'path': args.data, 'n_samples': len(data), 'classes': ['jaundice', 'normal'],
        'class_counts': {'jaundice': len(jaundice_images), 'normal': len(normal_images)},
        'split': {'train': len(train_df), 'held_out': len(test_df),
                  'held_out_jaundice': int((test_df.label == 'jaundice').sum()),
                  'held_out_normal': int((test_df.label == 'normal').sum()),
                  'method': 'train_test_split(test_size=0.2, random_state=42), shared by all models; '
                            'the notebook has no separate validation set: deep-model validation_data is the held-out set, '
                            'used only for monitoring (no early stopping or checkpoint selection)'},
    },
    'decision_threshold': 0.5,
    'positive_class': 'jaundice',
    'best_by_roc_auc': best,
    'models': RESULTS,
    'train_seconds': {k: round(v, 1) for k, v in timings.items()},
}
json.dump(summary, open(os.path.join(OUT, 'results.json'), 'w'), indent=2)
json.dump({
    'deep': {'input_size': [224, 224], 'color': 'RGB', 'rescale': 1 / 255,
             'class_indices': CLASS_INDICES, 'output': 'sigmoid = P(normal); P(jaundice) = 1 - output'},
    'classical': {'input_size': [64, 64], 'color': 'grayscale (cv2.IMREAD_GRAYSCALE)', 'scaling': 'none (raw 0-255)',
                  'features': 'flattened 4096 pixels', 'labels': {'Normal': 0, 'Jaundice': 1}},
}, open(os.path.join(OUT, 'preprocessing.json'), 'w'), indent=2)

print('\n\nSUMMARY (held-out set, jaundice = positive, threshold 0.5)')
print(f"{'model':22s} {'acc':>6} {'prec':>6} {'sens':>6} {'spec':>6} {'f1':>6} {'auc':>6}   tn fp fn tp")
for n in names:
    r = RESULTS[n]; c = r['confusion_matrix']
    print(f"{n:22s} {r['accuracy']:6.3f} {r['precision']:6.3f} {r['recall_sensitivity']:6.3f} {r['specificity']:6.3f} "
          f"{r['f1']:6.3f} {r['roc_auc']:6.3f}   {c['tn']:2d} {c['fp']:2d} {c['fn']:2d} {c['tp']:2d}")
print('Best by ROC-AUC:', best)
