function ease(t: number, b: number, c: number, d: number) {
  return t === d ? b + c : c * (-Math.pow(2, (-10 * t) / d) + 1) + b
}

/**
 * Tween from `start` to `end` over `duration` ms using an exponential ease-out.
 * Returns a function that starts the tween. That function returns a stop handle.
 *
 * Adapted from tinkerbell.
 */
export function tween(start: number, end: number, duration: number) {
  return function run(cb: (v: number) => void, done?: () => void) {
    let ts: number | undefined
    let frame: number

    frame = (function tick(last: number) {
      return requestAnimationFrame(t => {
        if (!ts) ts = t
        const te = t - ts
        const next = Math.round(ease(te, start, end - start, duration))
        if (
          (end > start
            ? next < end && last <= end
            : next > end && last >= end) &&
          te <= duration
        ) {
          frame = tick(next)
          cb(next)
        } else {
          cb(end)
          done?.()
        }
      })
    })(start)

    return function stop() {
      cancelAnimationFrame(frame)
    }
  }
}
