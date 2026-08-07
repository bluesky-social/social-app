# react-native-worklets@0.8.3.patch

Backport of https://github.com/software-mansion/react-native-reanimated/pull/10167
("fix(Worklets): web scheduleOnUI implementation on errors").

## The bug

On web, `scheduleOnUI`/`runOnUI` batch their callbacks per animation frame and
run them with `queue.forEach(...)`. If any callback in the batch throws,
`forEach` aborts immediately and every callback still queued after it is
silently dropped - it never runs, and any `runOnUIAsync` promise for it never
resolves or rejects.

Reanimated's own internals rely on those callbacks running in order (e.g. to
populate `frameCallbackRegistry`), so a single throwing worklet in a batch can
leave later, unrelated frame callbacks referencing state that was never set
up, surfacing as:

```
TypeError: can't access property "startTime", this.frameCallbackRegistry.get(...) is undefined
```

## The fix

Replace the `forEach` batch runner with a `while` loop (`drainUIQueue`) that
tracks its position via an `offset`, wrapped in a `try`/`catch`. A throw now
only aborts the *current* callback: the loop resumes at the next queued job
instead of abandoning the rest of the batch. Errors are routed to the
matching `runOnUIAsync` promise's `reject` (a new second argument threaded
through `enqueueUI`) if there is one, or `console.error`-ed otherwise, rather
than crashing the whole frame.

Only `lib/module/threads.js` (the compiled web entry point actually loaded by
the app's webpack build) is patched - `src/threads.ts` is unused here since
this repo's web build resolves the package's `module` field, and native
platforms use the separate `threads.native.ts` implementation untouched by
this PR.
