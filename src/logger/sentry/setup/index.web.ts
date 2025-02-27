import {init} from '@sentry/react-native'

init({
  enabled: !__DEV__,
  autoSessionTracking: false,
  dsn: 'https://8fb55ba4807fca137eedfc8403ee27ba@o4505071687041024.ingest.us.sentry.io/4508807082278912',
  debug: false, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
  environment: process.env.NODE_ENV,
  ignoreErrors: ['t is not defined'],
})
