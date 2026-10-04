from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from PIL import Image
import json
import os

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "../nova_jaundice.keras")
METRICS_PATH = os.path.join(BASE_DIR, "../model_metrics.json")

print(f"Loading trained AI model from: {MODEL_PATH}")
model = tf.keras.models.load_model(MODEL_PATH)
metrics = json.load(open(METRICS_PATH))
THRESHOLD = metrics["threshold"]

IMG_SIZE = 224


def preprocess(file):
    # Centre-crop to square (training photos are square), then resize with tf.image.resize (bilinear,
    # no antialiasing) exactly as the model was trained. Raw 0-255 pixels: normalisation is inside the model.
    img = Image.open(file.stream).convert("RGB")
    w, h = img.size
    side = min(w, h)
    img = img.crop(((w - side) // 2, (h - side) // 2, (w + side) // 2, (h + side) // 2))
    arr = tf.image.resize(np.asarray(img, dtype=np.float32), (IMG_SIZE, IMG_SIZE))
    return np.expand_dims(arr.numpy(), 0)


@app.route("/")
def home():
    return "Nova AI Inference Server Running!"


@app.route("/model")
def model_info():
    return jsonify(metrics)


@app.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    try:
        p = float(model.predict(preprocess(request.files["image"]), verbose=0)[0][0])
    except Exception as e:
        print(f"Error during prediction: {e}")
        return jsonify({"error": str(e)}), 500

    if p >= THRESHOLD:
        risk, result = "High", "Jaundice"
    elif p >= THRESHOLD / 2:
        risk, result = "Moderate", "Possible Jaundice"
    else:
        risk, result = "Normal", "Normal"

    return jsonify({
        "prediction": result,
        "risk": risk,
        "probability": round(p, 4),
        "confidence": round((p if p >= THRESHOLD else 1 - p) * 100, 2),
        "threshold": THRESHOLD,
        "model": metrics["model"],
    })


if __name__ == "__main__":
    app.run(port=8000, host="0.0.0.0")
