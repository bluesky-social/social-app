export const openPicker = jest
  .fn()
  .mockImplementation(() => Promise.resolve({uri: ''}))
export const openCamera = jest
  .fn()
  .mockImplementation(() => Promise.resolve({uri: ''}))
export const openCropper = jest
  .fn()
  .mockImplementation(() => Promise.resolve({uri: ''}))
