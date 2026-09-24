"""Train the Nova neonatal jaundice classifier (ImageNet transfer learning: MobileNetV2 or EfficientNetB0).

Model contract (shared by the Flask server and the mobile app):
  input : float32 [1, 224, 224, 3], raw RGB pixels in 0..255 (preprocessing is inside the model)
  output: float32 [1, 1], probability that the image shows jaundice
"""
import argparse
import csv
import json
import os

import numpy as np
import tensorflow as tf
from sklearn.metrics import confusion_matrix, roc_auc_score

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
IMG = 224
BATCH = 32
SEED = 42
TARGET_SENSITIVITY = 0.90  # screening: missing jaundice is worse than a false alarm

tf.keras.utils.set_random_seed(SEED)


def load_split():
    rows = list(csv.DictReader(open(os.path.join(HERE, "split.csv"))))
    out = {}
    for s in ("train", "val", "test"):
        r = [x for x in rows if x["split"] == s]
        out[s] = ([x["path"] for x in r], np.array([int(x["label"]) for x in r], dtype=np.float32))
    return out


def decode(path, label):
    img = tf.io.decode_jpeg(tf.io.read_file(path), channels=3)
    img = tf.image.resize(img, (IMG, IMG), antialias=True)
    return img, label


def make_ds(paths, labels, training):
    ds = tf.data.Dataset.from_tensor_slices((paths, labels))
    if training:
        ds = ds.shuffle(len(paths), seed=SEED, reshuffle_each_iteration=True)
    ds = ds.map(decode, num_parallel_calls=tf.data.AUTOTUNE).cache()
    return ds.batch(BATCH).prefetch(tf.data.AUTOTUNE)


def build_model(backbone):
    # Geometric + mild brightness/contrast only: hue/saturation shifts would erase the yellow signal.
    augment = tf.keras.Sequential([
        tf.keras.layers.RandomFlip("horizontal_and_vertical"),
        tf.keras.layers.RandomRotation(0.1),
        tf.keras.layers.RandomZoom(0.15),
        tf.keras.layers.RandomBrightness(0.1, value_range=(0, 255)),
        tf.keras.layers.RandomContrast(0.1),
    ], name="augment")

    inp = tf.keras.Input((IMG, IMG, 3), name="image")
    x = augment(inp)
    if backbone == "mobilenetv2":
        base = tf.keras.applications.MobileNetV2(input_shape=(IMG, IMG, 3), include_top=False, weights="imagenet")
        x = tf.keras.layers.Rescaling(1 / 127.5, offset=-1, name="mobilenet_preprocess")(x)
    else:  # EfficientNetB0 normalises 0-255 input internally
        base = tf.keras.applications.EfficientNetB0(input_shape=(IMG, IMG, 3), include_top=False, weights="imagenet")
    base.trainable = False
    x = base(x, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dropout(0.3)(x)
    out = tf.keras.layers.Dense(1, activation="sigmoid", name="p_jaundice")(x)
    return tf.keras.Model(inp, out, name=f"nova_jaundice_{backbone}"), base


def pick_threshold(y, p):
    """Highest threshold that still reaches TARGET_SENSITIVITY on validation data."""
    best = 0.5
    for t in np.linspace(0.05, 0.95, 91):
        if ((p >= t) & (y == 1)).sum() / max(1, (y == 1).sum()) >= TARGET_SENSITIVITY:
            best = float(t)
    return round(best, 2)


def metrics(y, p, t):
    tn, fp, fn, tp = confusion_matrix(y, (p >= t).astype(int), labels=[0, 1]).ravel()
    return {
        "threshold": t,
        "accuracy": round((tp + tn) / len(y), 4),
        "sensitivity": round(tp / max(1, tp + fn), 4),
        "specificity": round(tn / max(1, tn + fp), 4),
        "precision": round(tp / max(1, tp + fp), 4),
        "auc": round(float(roc_auc_score(y, p)), 4),
        "confusion": {"tp": int(tp), "fn": int(fn), "fp": int(fp), "tn": int(tn)},
        "n": int(len(y)),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--backbone", choices=["mobilenetv2", "efficientnetb0"], default="mobilenetv2")
    ap.add_argument("--head-epochs", type=int, default=25)
    ap.add_argument("--ft-lr", type=float, default=1e-5)
    ap.add_argument("--ft-layers", type=int, default=40)
    ap.add_argument("--no-export", action="store_true", help="experiment only: report validation metrics, skip test + export")
    args = ap.parse_args()
    data = load_split()
    train_ds = make_ds(*data["train"], training=True)
    val_ds = make_ds(*data["val"], training=False)
    test_ds = make_ds(*data["test"], training=False)

    y_train = data["train"][1]
    pos = y_train.sum()
    class_weight = {0: len(y_train) / (2 * (len(y_train) - pos)), 1: len(y_train) / (2 * pos)}

    model, base = build_model(args.backbone)
    auc = tf.keras.metrics.AUC(name="auc")
    cb = [tf.keras.callbacks.EarlyStopping(monitor="val_auc", mode="max", patience=6, restore_best_weights=True)]

    print("\n== Phase 1: train classifier head")
    model.compile(tf.keras.optimizers.Adam(1e-3), "binary_crossentropy", metrics=["accuracy", auc])
    model.fit(train_ds, validation_data=val_ds, epochs=args.head_epochs, class_weight=class_weight, callbacks=cb, verbose=2)

    print("\n== Phase 2: fine-tune top of backbone")
    base.trainable = True
    for layer in base.layers[:-args.ft_layers]:
        layer.trainable = False
    for layer in base.layers:
        if isinstance(layer, tf.keras.layers.BatchNormalization):
            layer.trainable = False
    model.compile(tf.keras.optimizers.Adam(args.ft_lr), "binary_crossentropy", metrics=["accuracy", auc])
    model.fit(train_ds, validation_data=val_ds, epochs=30, class_weight=class_weight, callbacks=cb, verbose=2)

    p_val = model.predict(val_ds, verbose=0).ravel()
    if args.no_export:
        print("RESULT", json.dumps({**vars(args), "val": metrics(data["val"][1], p_val, pick_threshold(data["val"][1], p_val))}))
        return
    p_test = model.predict(test_ds, verbose=0).ravel()
    t = pick_threshold(data["val"][1], p_val)
    report = {
        "model": {"mobilenetv2": "Nova Jaundice MobileNetV2 v3.0", "efficientnetb0": "Nova Jaundice EfficientNetB0 v3.0"}[args.backbone],
        "input": {"shape": [1, IMG, IMG, 3], "dtype": "float32", "range": "0-255 RGB"},
        "output": "probability of jaundice",
        "threshold": t,
        "val": metrics(data["val"][1], p_val, t),
        "test": metrics(data["test"][1], p_test, t),
        "test_at_0.5": metrics(data["test"][1], p_test, 0.5),
        "split_sizes": {k: int(len(v[1])) for k, v in data.items()},
    }
    print(json.dumps(report, indent=2))

    # Export: .keras for the Flask server, .tflite for Android/iOS.
    model.save(os.path.join(ROOT, "nova_jaundice.keras"))
    conv = tf.lite.TFLiteConverter.from_keras_model(model)
    conv.optimizations = [tf.lite.Optimize.DEFAULT]
    conv.target_spec.supported_types = [tf.float16]
    tflite = conv.convert()
    os.makedirs(os.path.join(ROOT, "mobile", "assets", "model"), exist_ok=True)
    open(os.path.join(ROOT, "mobile", "assets", "model", "nova_jaundice.tflite"), "wb").write(tflite)
    json.dump(report, open(os.path.join(ROOT, "model_metrics.json"), "w"), indent=2)
    json.dump(report, open(os.path.join(ROOT, "mobile", "assets", "model", "model_metrics.json"), "w"), indent=2)

    # Sanity check: TFLite must agree with Keras on the test set.
    interp = tf.lite.Interpreter(model_content=tflite)
    interp.allocate_tensors()
    i_in, i_out = interp.get_input_details()[0]["index"], interp.get_output_details()[0]["index"]
    diffs = []
    for (x, _), pk in zip(test_ds.unbatch().batch(1), p_test):
        interp.set_tensor(i_in, x.numpy().astype(np.float32))
        interp.invoke()
        diffs.append(abs(float(interp.get_tensor(i_out)[0][0]) - pk))
    print(f"TFLite vs Keras max |diff| on test set: {max(diffs):.4f}  ({len(tflite) / 1e6:.1f} MB)")


if __name__ == "__main__":
    main()
