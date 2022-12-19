jest.mock('rn-fetch-blob', () => {
  return {
    __esModule: true,
    default: {
      fs: {
        unlink: jest.fn(),
      },
    },
  }
})
