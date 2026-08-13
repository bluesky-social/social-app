import {
  addBreadcrumb,
  captureException,
  captureFeedback,
  captureMessage,
  getClient,
  startInactiveSpan,
  withActiveSpan,
  withScope,
  wrap,
} from '@sentry/react-native'

/**
 * Curated subset of @sentry/react-native, listing only the symbols the app
 * actually uses. Re-exporting the whole SDK namespace
 * (`export * as Sentry from '@sentry/react-native'`) defeats Metro
 * tree-shaking on web and pulls in ~180KB of dead weight.
 *
 * When the app needs another SDK function, add it to the import above and to
 * this object, then run a web build to confirm the bundle size is unaffected.
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
  wrap,
}
