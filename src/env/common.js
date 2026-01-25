import packageJson from '#/../package.json';
/**
 * The semver version of the app, as defined in `package.json.`
 *
 * N.B. The fallback is needed for Render.com deployments
 */
export var RELEASE_VERSION = process.env.EXPO_PUBLIC_RELEASE_VERSION || packageJson.version;
/**
 * The env the app is running in e.g. development, testflight, production, e2e
 */
export var ENV = process.env.EXPO_PUBLIC_ENV;
/**
 * Indicates whether the app is running in TestFlight
 */
export var IS_TESTFLIGHT = ENV === 'testflight';
/**
 * Indicates whether the app is `__DEV__`
 */
export var IS_DEV = __DEV__;
/**
 * Indicates whether the app is running in a test environment
 */
export var IS_E2E = ENV === 'e2e';
/**
 * Indicates whether the app is `__DEV__` or TestFlight
 */
export var IS_INTERNAL = IS_DEV || IS_TESTFLIGHT;
/**
 * The commit hash that the current bundle was made from. The user can
 * see the commit hash in the app's settings along with the other version info.
 * Useful for debugging/reporting.
 */
export var BUNDLE_IDENTIFIER = process.env.EXPO_PUBLIC_BUNDLE_IDENTIFIER || 'dev';
/**
 * This will always be in the format of YYMMDDHH, so that it always increases
 * for each build. This should only be used for analytics reporting and shouldn't
 * be used to identify a specific bundle.
 */
export var BUNDLE_DATE = process.env.EXPO_PUBLIC_BUNDLE_DATE === undefined
    ? 0
    : Number(process.env.EXPO_PUBLIC_BUNDLE_DATE);
/**
 * The log level for the app.
 */
export var LOG_LEVEL = (process.env.EXPO_PUBLIC_LOG_LEVEL || 'info');
/**
 * Enable debug logs for specific logger instances
 */
export var LOG_DEBUG = process.env.EXPO_PUBLIC_LOG_DEBUG || '';
/**
 * The DID of the Bluesky appview to proxy to
 */
export var BLUESKY_PROXY_DID = process.env.EXPO_PUBLIC_BLUESKY_PROXY_DID || 'did:web:api.bsky.app';
/**
 * The DID of the chat service to proxy to
 */
export var CHAT_PROXY_DID = process.env.EXPO_PUBLIC_CHAT_PROXY_DID || 'did:web:api.bsky.chat';
/**
 * Metrics API host
 */
export var METRICS_API_HOST = process.env.EXPO_PUBLIC_METRICS_API_HOST || 'https://events.bsky.app';
/**
 * Growthbook API host
 */
export var GROWTHBOOK_API_HOST = process.env.EXPO_PUBLIC_GROWTHBOOK_API_HOST || "".concat(METRICS_API_HOST, "/gb");
/**
 * Growthbook client key
 */
export var GROWTHBOOK_CLIENT_KEY = process.env.EXPO_PUBLIC_GROWTHBOOK_CLIENT_KEY || 'sdk-7gkUkGy9wguUjyFe';
/**
 * Sentry DSN for telemetry
 */
export var SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
/**
 * Bitdrift API key. If undefined, Bitdrift should be disabled.
 */
export var BITDRIFT_API_KEY = process.env.EXPO_PUBLIC_BITDRIFT_API_KEY;
/**
 * GCP project ID which is required for native device attestation. On web, this
 * should be unset and evaluate to 0.
 */
export var GCP_PROJECT_ID = process.env.EXPO_PUBLIC_GCP_PROJECT_ID === undefined
    ? 0
    : Number(process.env.EXPO_PUBLIC_GCP_PROJECT_ID);
/**
 * URLs for the app config web worker. Can be a
 * locally running server, see `env.example` for more.
 */
export var GEOLOCATION_DEV_URL = process.env.GEOLOCATION_DEV_URL;
export var GEOLOCATION_PROD_URL = "https://ip.bsky.app";
export var GEOLOCATION_URL = IS_DEV
    ? (GEOLOCATION_DEV_URL !== null && GEOLOCATION_DEV_URL !== void 0 ? GEOLOCATION_DEV_URL : GEOLOCATION_PROD_URL)
    : GEOLOCATION_PROD_URL;
/**
 * URLs for the live-event config web worker. Can be a
 * locally running server, see `env.example` for more.
 */
export var LIVE_EVENTS_DEV_URL = process.env.LIVE_EVENTS_DEV_URL;
export var LIVE_EVENTS_PROD_URL = "https://live-events.workers.bsky.app";
export var LIVE_EVENTS_URL = IS_DEV
    ? (LIVE_EVENTS_DEV_URL !== null && LIVE_EVENTS_DEV_URL !== void 0 ? LIVE_EVENTS_DEV_URL : LIVE_EVENTS_PROD_URL)
    : LIVE_EVENTS_PROD_URL;
