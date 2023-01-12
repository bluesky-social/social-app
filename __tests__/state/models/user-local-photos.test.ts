import {UserLocalPhotosModel} from '../../../src/state/models/user-local-photos'
import {RootStoreModel} from '../../../src/state/models/root-store'
import {sessionClient, SessionServiceClient} from '@atproto/api'
import {DEFAULT_SERVICE} from '../../../src/state'

describe('UserLocalPhotosModel', () => {
  const photos = [
    {node: {image: {uri: 'path/to/image1.jpg'}}},
    {node: {image: {uri: 'path/to/image2.jpg'}}},
    {node: {image: {uri: 'path/to/image3.jpg'}}},
  ]
  let model: UserLocalPhotosModel
  let rootStore: RootStoreModel
  let api: SessionServiceClient

  beforeEach(() => {
    api = sessionClient.service(DEFAULT_SERVICE) as SessionServiceClient
    rootStore = new RootStoreModel(api)
    model = new UserLocalPhotosModel(rootStore)
  })

  afterAll(() => {
    jest.clearAllMocks()
  })

  it('should set photos state when setup is called', async () => {
    await model.setup()
    expect(model.photos).toEqual(photos)
  })
})
