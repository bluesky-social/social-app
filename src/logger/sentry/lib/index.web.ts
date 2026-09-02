import {
  addBreadcrumb,
  captureException,
  captureFeedback,
  captureMessage,
  getClient,
  startInactiveSpan,
  withActiveSpan,
  withScope,
} from '@sentry/browser'

/**
 * Web counterpart of ./index.ts. Importing from `@sentry/browser` instead of
 * `@sentry/react-native` keeps the RN SDK layer (native wrapper, RN tracing,
 * feedback widget, RN integrations - roughly 200KB minified) out of the web
 * bundle. All of these APIs are re-exported from `@sentry/core` by both
 * packages, so behavior is identical.
 *
 * When the app needs another SDK function, add it here and to ./index.ts, then
 * run a web build to confirm the bundle size is unaffected.
 */
export const Sentry = {
  addBreadcrumb,
  captureException,
  captureFeedback,
  captureMessage,
  getClient,
  startInactiveSpan,
  withActiveSpan,
  withScope,
  /**
   * `wrap` does not exist in `@sentry/browser`. On web, the RN SDK's `wrap`
   * only adds a touch-event breadcrumb boundary and a React profiler span, so
   * we pass the root component through unchanged.
   */
  wrap: <P extends Record<string, unknown>>(
    component: React.ComponentType<P>,
  ): React.ComponentType<P> => component,
}
