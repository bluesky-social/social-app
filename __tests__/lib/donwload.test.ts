// import {act} from 'react-test-renderer'

// import RNFetchBlob from 'rn-fetch-blob'
// import ImageResizer from '@bam.tech/react-native-image-resizer'

// import {downloadAndResize} from '../../src/lib/download'

// describe('downloadAndResize', () => {
//   it('should download and resize an image', async () => {
//     const uri = 'https://example.com/image.jpg'
//     const width = 100
//     const height = 100
//     const mode = 'contain'
//     const timeout = 1000
//     const opts = {uri, width, height, mode, timeout}

//     // Mock RNFetchBlob.fetch to return a successful response
//     jest.spyOn(RNFetchBlob, 'fetch').mockImplementation(() => {
//       return Promise.resolve({
//         path: () => 'file:///path/to/image.jpg',
//       })
//     })

//     // Mock ImageResizer.createResizedImage to return a successful response
//     jest.spyOn(ImageResizer, 'createResizedImage').mockImplementation(() => {
//       return Promise.resolve({
//         uri: 'file:///path/to/resized-image.jpg',
//       })
//     })

//     let error
//     let res
//     await act(async () => {
//       try {
//         res = await downloadAndResize(opts)
//       } catch (e) {
//         error = e
//       }
//     })

//     expect(error).toBeUndefined()
//     expect(res).toEqual({uri: 'file:///path/to/resized-image.jpg'})
//   })
// })
