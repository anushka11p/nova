#!/bin/sh
# Model selection on the validation split only; the test split is reserved for the final report.
cd "$(dirname "$0")"
for cfg in \
  "--backbone efficientnetb0 --head-epochs 40 --ft-lr 1e-5 --ft-layers 40" \
  "--backbone efficientnetb0 --head-epochs 40 --ft-lr 3e-5 --ft-layers 80" \
  "--backbone mobilenetv2 --head-epochs 50 --ft-lr 1e-4 --ft-layers 60"; do
  .venv/bin/python train.py $cfg --no-export 2>&1 | grep -E "^RESULT|Traceback|Error"
done
