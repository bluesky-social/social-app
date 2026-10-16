import {createOnigurumaEngine} from '@shikijs/engine-oniguruma'

export function createEngine() {
  return createOnigurumaEngine(import('@shikijs/engine-oniguruma/wasm-inlined'))
}
