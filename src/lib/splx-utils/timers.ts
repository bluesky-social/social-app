import { getGlobal } from './global';
import { isNil } from './functions';
import { register } from './singleton';

const keyPrefix = '@townsquare/lib/splx-utils/timers#';
const globals = register(() => {
  return {
    canUsePerformance: !!getGlobal().performance,
    baseDate: 0,
    baseDateSet: 0,
  };
}, `${keyPrefix}canUsePerformance`);

function _unsetBaseDate() {
  globals.baseDate = 0;
  globals.baseDateSet = 0;
}

export function setBaseDate(timeMs?: number) {
  if (timeMs === undefined) {
    _unsetBaseDate();
    return;
  }
  globals.baseDateSet = Date.now();
  globals.baseDate = timeMs;
}

export function now(useDate: boolean = false) {
  if (globals.canUsePerformance && !globals.baseDateSet && !useDate) {
    return performance.now();
  }
  const now = Date.now();
  if (globals.baseDateSet) {
    const delta = now - globals.baseDateSet;
    return globals.baseDate + delta;
  }
  return now;
}

export function dateNow() {
  return now(true);
}

export function nowSec() {
  return parseInt(`${now(true) / 1000}`);
}

export async function sleep(ms: number) {
  return await new Promise((resolve) => setTimeout(resolve, Math.max(ms, 0)));
}

const noop: Function = () => {};

export async function retry<T>(
  method: (...args: any[]) => Promise<T>,
  retries: number = 3,
  retryDelay: number = 200,
  onRetry?: (err: any, retry: number, retries: number) => number | undefined
): Promise<Awaited<ReturnType<typeof method>>> {
  let retry = 0;
  let output: any;
  let success = false;
  let error: any;
  let retryChanged = false;
  let retryCt = 0;
  while (retry < retries && !success) {
    try {
      output = await method(retry);
      success = true;
      break;
    } catch (err: any) {
      error = err;
    }

    if (onRetry && !retryChanged) {
      let proposedRetry = onRetry(error, retry, retries);
      proposedRetry = isNil(retry) ? Infinity : proposedRetry;
      retryChanged = retry !== proposedRetry;
      retry = proposedRetry as number;
    }

    if (retry < retries) {
      retryCt++;
      await sleep(retryCt * retryDelay);
    }
    retry++;
  }
  if (!success) {
    throw error ? (error as Error) : new Error('Retries failed');
  }
  return output;
}

export async function callWithTimeout<T>(
  fn: (...args: any[]) => Promise<T>,
  timeout: number = -1
): Promise<Awaited<ReturnType<typeof fn> | undefined>> {
  timeout = timeout < 0 ? Infinity : timeout;
  return await new Promise((resolve, reject) => {
    let done = false;
    const to = setTimeout(() => {
      if (done) {
        return;
      }
      done = true;
      resolve(undefined);
    }, timeout);
    fn()
      .then((result) => {
        if (done) {
          return;
        }
        done = true;
        clearTimeout(to);
        resolve(result);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export function raf(fn: (...args: any[]) => void) {
  return getGlobal().requestAnimationFrame ? getGlobal().requestAnimationFrame(() => fn()) : setTimeout(() => fn(), 0);
}

export async function tryEachAnimationFrame(
  fn: (...args: any[]) => boolean | undefined,
  timeout: number = 2 * 1000
): Promise<void> {
  return await new Promise((resolve, reject) => {
    const time = now();
    function attemptRaf() {
      raf(() => {
        const done = fn();
        !!done || now() - time > timeout ? resolve() : attemptRaf();
      });
    }
    attemptRaf();
  });
}
