import { Json } from './json';
import { getGlobal } from './global';

const registryKey = `@dispatch-services/singletonRegistry`;

function getRegistry(): Json {
  if (!getGlobal()[registryKey]) {
    Object.defineProperty(getGlobal(), registryKey, {
      configurable: true,
      value: {},
    });
  }
  return getGlobal()[registryKey];
}

export function register<T>(fn: () => T, key: string): ReturnType<typeof fn> {
  const registry = getRegistry();
  if (!registry[key]) {
    registry[key] = fn();
  }
  return registry[key];
}
