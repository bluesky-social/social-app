/*
 * Stub for @sentry/react-native. The real package is CJS and requires
 * `react-native` internally, which boots the native runtime under node. Many
 * test-reachable modules pull it in transitively via #/logger. We only need
 * the surface sentryTransport touches (src/logger/transports/sentry.ts).
 *
 * Aliased in place of @sentry/react-native via resolve.alias in
 * vitest.config.ts. Tests that assert on Sentry calls (logger.test.ts) still
 * vi.mock it directly, which takes precedence.
 */
import {vi} from 'vitest'

export const addBreadcrumb = vi.fn()
export const captureException = vi.fn()
export const captureMessage = vi.fn()
export const init = vi.fn()
