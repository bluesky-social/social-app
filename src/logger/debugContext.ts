/**
 * *Do not import this directly.* Instead, use the shortcut reference `logger.DebugContext`.
 *
 * Add debug contexts here. Although convention typically calls for enums ito
 * be capitalized, for parity with the `LOG_DEBUG` env var, please use all
 * lowercase.
 */
export const DebugContext = {
  // e.g. composer: 'composer'
  session: 'session',
  notifications: 'notifications',
  convo: 'convo',
} as const
