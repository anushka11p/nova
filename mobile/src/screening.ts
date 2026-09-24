import { Buffer } from 'buffer';
import * as ImageManipulator from 'expo-image-manipulator';
import jpeg from 'jpeg-js';
import type { TensorflowModel } from 'react-native-fast-tflite';

import metrics from '../assets/model/model_metrics.json';

export const INPUT_SIZE = 224;
/** Decision threshold chosen on validation data to favour sensitivity (see ml/train.py). */
export const THRESHOLD: number = metrics.threshold;
export const MODEL_NAME: string = metrics.model;

export type RiskLevel = 'Normal' | 'Moderate' | 'High';

export interface ScreeningResult {
  probability: number;
  risk: RiskLevel;
  headline: string;
  recommendation: string;
  ms: number;
}

/**
 * Centre-crop to a square (the training photos are square) and resize to 224x224,
 * then decode to a float32 RGB tensor with values in 0..255 — the model does its own normalisation.
 */
export async function imageToTensor(uri: string, width: number, height: number): Promise<Float32Array> {
  const side = Math.min(width, height);
  const image = await ImageManipulator.ImageManipulator.manipulate(uri)
    .crop({ originX: (width - side) / 2, originY: (height - side) / 2, width: side, height: side })
    .resize({ width: INPUT_SIZE, height: INPUT_SIZE })
    .renderAsync();
  const saved = await image.saveAsync({ format: ImageManipulator.SaveFormat.JPEG, compress: 1, base64: true });
  if (!saved.base64) throw new Error('Could not read image pixels');

  const { data, width: w, height: h } = jpeg.decode(Buffer.from(saved.base64, 'base64'), { useTArray: true });
  if (w !== INPUT_SIZE || h !== INPUT_SIZE) throw new Error(`Unexpected image size ${w}x${h}`);

  const out = new Float32Array(INPUT_SIZE * INPUT_SIZE * 3);
  for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
    out[j] = data[i];
    out[j + 1] = data[i + 1];
    out[j + 2] = data[i + 2];
  }
  return out;
}

export function classify(probability: number): Omit<ScreeningResult, 'ms'> {
  if (probability >= THRESHOLD) {
    return {
      probability,
      risk: 'High',
      headline: 'Signs of jaundice detected',
      recommendation: 'Arrange a serum or transcutaneous bilirubin measurement promptly and have a clinician review the baby.',
    };
  }
  if (probability >= THRESHOLD / 2) {
    return {
      probability,
      risk: 'Moderate',
      headline: 'Borderline — possible jaundice',
      recommendation: 'Re-screen in good natural light and check bilirubin if there is any clinical concern.',
    };
  }
  return {
    probability,
    risk: 'Normal',
    headline: 'No visible signs of jaundice',
    recommendation: 'Continue routine newborn care. Re-screen if skin or eyes start to look yellow.',
  };
}

export async function screen(model: TensorflowModel, uri: string, width: number, height: number): Promise<ScreeningResult> {
  const start = Date.now();
  const input = await imageToTensor(uri, width, height);
  const [output] = await model.run([input.buffer as ArrayBuffer]);
  const probability = new Float32Array(output)[0];
  return { ...classify(probability), ms: Date.now() - start };
}
