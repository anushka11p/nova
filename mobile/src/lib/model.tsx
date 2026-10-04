import { createContext, ReactNode, useContext } from 'react';
import { TensorflowModel, useTensorflowModel } from 'react-native-fast-tflite';

type ModelState = { state: 'loading' } | { state: 'error'; error: Error } | { state: 'loaded'; model: TensorflowModel };

const ModelContext = createContext<ModelState>({ state: 'loading' });

/** Loads the on-device jaundice model once, at app start, so it is ready before the first screening. */
export function ModelProvider({ children }: { children: ReactNode }) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- bundled asset, the documented pattern
  const tflite = useTensorflowModel(require('../../assets/model/nova_jaundice.tflite'), []);
  const value: ModelState =
    tflite.state === 'loaded' ? { state: 'loaded', model: tflite.model }
      : tflite.state === 'error' ? { state: 'error', error: tflite.error }
        : { state: 'loading' };
  return <ModelContext.Provider value={value}>{children}</ModelContext.Provider>;
}

export const useModel = () => useContext(ModelContext);
