export const from = jest.fn().mockImplementation(() => {
  return {
    digest: jest.fn().mockImplementation(() => {
      return Promise.resolve('')
    }),
  }
})
