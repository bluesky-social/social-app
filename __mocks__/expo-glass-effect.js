jest.mock('expo-glass-effect', () => ({
  isLiquidGlassAvailable: () => jest.fn(() => false),
}))
