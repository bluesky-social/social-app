jest.mock('sentry-expo', () => ({
  init: () => jest.fn(),
  Native: {
    ReactNativeTracing: jest.fn().mockImplementation(() => ({
      start: jest.fn(),
      stop: jest.fn(),
    })),
    ReactNavigationInstrumentation: jest.fn(),
  },
}))
