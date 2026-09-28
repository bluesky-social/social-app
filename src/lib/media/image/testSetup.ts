/* JSDOM lacks matchMedia; keep the real platform-specific env module in tests. */
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: jest.fn().mockReturnValue({matches: false}),
  })
}
