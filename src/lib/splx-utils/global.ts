import { shim } from 'globalthis';

let _global: ReturnType<typeof shim>;

export function getGlobal() {
  if (!_global) {
    _global = shim();
  }
  return _global;
}
