"""Predict jaundice for a new image with a model trained by diagnosis_of_jaundice.py.

Uses exactly the preprocessing each model was trained with (outputs/preprocessing.json):
  deep models      224x224 RGB, pixels / 255, sigmoid output = P(normal)
  classical models 64x64 grayscale, raw pixels, flattened to 4096 features, class 1 = jaundice

CLI:
  ml/.venv/bin/python ml/kaggle_notebook/predict.py photo.jpg                 # best model from results.json
  ml/.venv/bin/python ml/kaggle_notebook/predict.py photo.jpg --model cnn
  ml/.venv/bin/python ml/kaggle_notebook/predict.py a.jpg b.jpg --model all

Python:
  from predict import predict
  predict('photo.jpg')  # -> {'model': ..., 'prediction': 'Jaundice' | 'Normal', 'p_jaundice': 0.83, 'threshold': 0.5}
"""
import argparse
import json
import os
from functools import lru_cache

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'outputs')
MODELS = os.path.join(OUT, 'models')
DEEP = ('cnn', 'efficientnet_flatten', 'resnet50', 'efficientnet_frozen')
CLASSICAL = ('xgboost', 'random_forest', 'voting_ensemble')
THRESHOLD = 0.5  # the notebook's decision rule


def best_model():
    with open(os.path.join(OUT, 'results.json')) as fh:
        return json.load(fh)['best_by_roc_auc']


@lru_cache(maxsize=None)
def load_model(name):
    path = os.path.join(MODELS, f'{name}.keras' if name in DEEP else f'{name}.json' if name == 'xgboost' else f'{name}.joblib')
    if not os.path.exists(path):
        raise FileNotFoundError(f'{path} not found; run diagnosis_of_jaundice.py first')
    if name in DEEP:
        import tensorflow as tf
        return tf.keras.models.load_model(path)
    if name == 'xgboost':
        import xgboost as xgb
        m = xgb.XGBClassifier()
        m.load_model(path)
        return m
    import joblib
    return joblib.load(path)


def preprocess(image_path, name):
    if name in DEEP:
        # Same as ImageDataGenerator(rescale=1./255).flow_from_dataframe(target_size=(224, 224)):
        # load as RGB, nearest-neighbour resize, scale to 0..1.
        from tensorflow.keras.preprocessing.image import img_to_array, load_img
        img = load_img(image_path, color_mode='rgb', target_size=(224, 224), interpolation='nearest')
        return np.expand_dims(img_to_array(img) / 255.0, 0)
    import cv2
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise ValueError(f'Could not read image: {image_path}')
    return cv2.resize(img, (64, 64)).reshape(1, -1)


def predict(image_path, model=None):
    """Return the prediction for one image. `model` defaults to the best model by held-out ROC-AUC."""
    name = model or best_model()
    if name not in DEEP + CLASSICAL:
        raise ValueError(f'Unknown model {name!r}; choose from {DEEP + CLASSICAL}')
    m = load_model(name)
    x = preprocess(image_path, name)
    if name in DEEP:
        p_jaundice = 1.0 - float(m.predict(x, verbose=0)[0][0])  # class_indices: jaundice=0, normal=1
    else:
        p_jaundice = float(m.predict_proba(x)[0][1])
    return {
        'model': name,
        'prediction': 'Jaundice' if p_jaundice >= THRESHOLD else 'Normal',
        'p_jaundice': round(p_jaundice, 4),
        'threshold': THRESHOLD,
    }


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('images', nargs='+')
    ap.add_argument('--model', default=None, help=f"one of {', '.join(DEEP + CLASSICAL)}, or 'all' (default: best)")
    a = ap.parse_args()
    names = list(DEEP + CLASSICAL) if a.model == 'all' else [a.model or best_model()]
    for img in a.images:
        for n in names:
            print(json.dumps({'image': img, **predict(img, n)}))
