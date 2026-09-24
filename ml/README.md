# Nova model training

Trains the neonatal jaundice image classifier from the photo dataset (`jaundice/` and `normal/` folders).

```bash
# ".nosync" keeps iCloud Drive from offloading the env when the project lives in ~/Documents
uv venv -p 3.11 .venv.nosync && ln -s .venv.nosync .venv
uv pip install --python .venv/bin/python tensorflow pillow scikit-learn flask flask-cors
.venv/bin/python prepare_split.py ~/Downloads/neoBloom/datasets   # dedupe + train/val/test split -> split.csv
.venv/bin/python train.py --backbone efficientnetb0 --head-epochs 40 --ft-lr 1e-5 --ft-layers 40
```

`prepare_split.py` removes exact duplicates and keeps near-duplicate shots in the same split so test scores are not inflated.
`sweep.sh` compares configurations on the validation split only; the test split is used once, for the final report.

Outputs:

- `../nova_jaundice.keras` — served by `backend/app.py`
- `../mobile/assets/model/nova_jaundice.tflite` — on-device model for the Android/iOS app
- `../model_metrics.json` — decision threshold plus validation and test metrics

Model contract: input float32 `[1, 224, 224, 3]` raw RGB 0–255 (normalisation is inside the model);
output is the probability of jaundice. The threshold is picked on validation data for ≥90% sensitivity.
