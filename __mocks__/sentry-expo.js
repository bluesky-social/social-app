jest.mock('sentry-expo', () => ({
  init: () => jest.fn(),
}))
