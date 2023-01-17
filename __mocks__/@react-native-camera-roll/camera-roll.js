export const CameraRoll = {
  getPhotos: jest.fn().mockResolvedValue({
    edges: [
      {node: {image: {uri: 'path/to/image1.jpg'}}},
      {node: {image: {uri: 'path/to/image2.jpg'}}},
      {node: {image: {uri: 'path/to/image3.jpg'}}},
    ],
  }),
}
