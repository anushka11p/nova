from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from PIL import Image
import os

app = Flask(__name__)
CORS(app)

# Resolve absolute path to the model file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "../neobloom_model.keras")

print(f"Loading trained AI model from: {MODEL_PATH}")
model = tf.keras.models.load_model(MODEL_PATH)

IMG_SIZE = (224, 224)

@app.route("/")
def home():
    return "Nova AI Inference Server Running!"

@app.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    image = request.files["image"]

    # Save file temporarily
    uploads_dir = os.path.join(BASE_DIR, "uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    filepath = os.path.join(uploads_dir, image.filename)
    image.save(filepath)

    try:
        # Preprocess image
        img = Image.open(filepath).convert("RGB")
        img = img.resize(IMG_SIZE)

        img_array = np.array(img, dtype=np.float32)
        img_array = img_array / 255.0
        img_array = np.expand_dims(img_array, axis=0)

        # Run inference
        prediction = model.predict(img_array)[0][0]

        # Classify based on Keras model outputs
        # Pushpa's original logic: >= 0.5 is Normal, < 0.5 is Jaundice
        if prediction >= 0.5:
            result = "Normal"
            confidence = prediction
        else:
            result = "Jaundice"
            confidence = 1 - prediction

        return jsonify({
            "prediction": result,
            "confidence": round(float(confidence * 100), 2)
        })
    except Exception as e:
        print(f"Error during prediction: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        # Ensure cleanup
        if os.path.exists(filepath):
            os.remove(filepath)

if __name__ == "__main__":
    # Listen on port 8000
    app.run(port=8000, host="0.0.0.0")
