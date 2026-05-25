// Curated re-export of @sentry/react-native. We list only the symbols the app
// actually uses, because `import * as Sentry from '@sentry/react-native'`
// defeats Metro's tree-shaker and pulls in ~180KB of dead weight.
//
// When adding a new function, add it here and run a web build to confirm
// tree-shaking is still working.
export {
  addBreadcrumb,
  captureException,
  captureMessage,
  withScope,
  wrap,
} from '@sentry/react-native'
