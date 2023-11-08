import {init} from 'sentry-expo'

init({
  dsn: 'https://05bc3789bf994b81bd7ce20c86ccd3ae@o4505071687041024.ingest.sentry.io/4505071690514432',
  enableInExpoDevelopment: false, // if true, Sentry will try to send events/errors in development mode.
  debug: false, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
  environment: __DEV__ ? 'development' : 'production', // Set the environment
})
