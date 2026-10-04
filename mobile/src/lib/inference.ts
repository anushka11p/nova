import { Buffer } from 'buffer';
import * as ImageManipulator from 'expo-image-manipulator';
import jpeg from 'jpeg-js';
import type { TensorflowModel } from 'react-native-fast-tflite';

import { riskFor, RiskKey, THRESHOLD } from './clinical';

export const INPUT_SIZE = 224;

/**
 * Centre-crop to a square (the training photos are square), resize to 224x224, and decode to a
 * float32 RGB tensor in 0..255. The model normalises internally (EfficientNetV2 include_preprocessing).
 */
async function imageToTensor(uri: string, width: number, height: number): Promise<Float32Array> {
  const side = Math.min(width, height);
  const image = await ImageManipulator.ImageManipulator.manipulate(uri)
    .crop({ originX: (width - side) / 2, originY: (height - side) / 2, width: side, height: side })
    .resize({ width: INPUT_SIZE, height: INPUT_SIZE })
    .renderAsync();
  const saved = await image.saveAsync({ format: ImageManipulator.SaveFormat.JPEG, compress: 1, base64: true });
  if (!saved.base64) throw new Error('Could not read the photo’s pixels.');

  const { data, width: w, height: h } = jpeg.decode(Buffer.from(saved.base64, 'base64'), { useTArray: true });
  if (w !== INPUT_SIZE || h !== INPUT_SIZE) throw new Error(`Unexpected image size ${w}×${h}.`);

  const out = new Float32Array(INPUT_SIZE * INPUT_SIZE * 3);
  for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
    out[j] = data[i];
    out[j + 1] = data[i + 1];
    out[j + 2] = data[i + 2];
  }
  return out;
}

export interface Analysis {
  probability: number;
  threshold: number;
  risk: RiskKey;
  ms: number;
}

export async function analyse(model: TensorflowModel, uri: string, width: number, height: number): Promise<Analysis> {
  const start = Date.now();
  const input = await imageToTensor(uri, width, height);
  const [output] = await model.run([input.buffer as ArrayBuffer]);
  const probability = new Float32Array(output)[0];
  return { probability, threshold: THRESHOLD, risk: riskFor(probability), ms: Date.now() - start };
}
