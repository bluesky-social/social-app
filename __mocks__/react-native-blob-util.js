jest.mock('react-native-blob-util', () => {
  return {
    __esModule: true,
    default: {
      fs: {
        unlink: jest.fn(),
      },
    },
  }
})
