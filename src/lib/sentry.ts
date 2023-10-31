import {isNative, isWeb} from 'platform/detection'
import {FC} from 'react'
import * as Sentry from 'sentry-expo'

// Sentry Initialization

export const getRoutingInstrumentation = () => {
  return new Sentry.Native.ReactNavigationInstrumentation() // initialize this in `onReady` prop of NavigationContainer
}

Sentry.init({
  dsn: 'https://6ea961aad0e9452cbd057c2360b98fae@o4505502295195648.ingest.sentry.io/4505502308302848',
  enableInExpoDevelopment: false, // if true, Sentry will try to send events/errors in development mode.
  debug: false, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
  environment: __DEV__ ? 'development' : 'production', // Set the environment
  // @ts-ignore exists but not in types, see https://docs.sentry.io/platforms/react-native/configuration/options/#enableAutoPerformanceTracking
  enableAutoPerformanceTracking: true, // Enable auto performance tracking
  tracesSampleRate: 0.5, // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring. // TODO: this might be too much in production
  _experiments: {
    // The sampling rate for profiling is relative to TracesSampleRate.
    // In this case, we'll capture profiles for 50% of transactions.
    profilesSampleRate: 0.5,
  },
  integrations: isNative
    ? [
        new Sentry.Native.ReactNativeTracing({
          shouldCreateSpanForRequest: url => {
            // Do not create spans for outgoing requests to a `/logs` endpoint as it is too noisy due to expo
            return !url.match(/\/logs$/)
          },
          routingInstrumentation: getRoutingInstrumentation(),
        }),
      ]
    : [], // no integrations for web, yet
})

// if web, use Browser client, otherwise use Native client
export function getSentryClient() {
  if (isWeb) {
    return Sentry.Browser
  }
  return Sentry.Native
}

// wrap root App component with Sentry for automatic touch event tracking and performance monitoring
export function withSentry(Component: FC) {
  if (isWeb) {
    return Component // .wrap is not required or available for web
  }
  const sentryClient = getSentryClient()
  return sentryClient.wrap(Component)
}
