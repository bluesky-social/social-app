import {ProfilesViewModel} from '../../../src/state/models/profiles-view'
import {RootStoreModel} from '../../../src/state/models/root-store'
import {
  sessionClient,
  SessionServiceClient,
  AppBskyActorGetProfile as GetProfile,
} from '@atproto/api'
import {DEFAULT_SERVICE} from '../../../src/state'

describe('ProfilesViewModel', () => {
  let model: ProfilesViewModel
  let rootStore: RootStoreModel
  let api: SessionServiceClient

  beforeEach(() => {
    api = sessionClient.service(DEFAULT_SERVICE) as SessionServiceClient
    rootStore = new RootStoreModel(api)
    jest
      .spyOn(rootStore.api.app.bsky.actor, 'getProfile')
      .mockImplementation((): Promise<any> => {
        return Promise.resolve({
          data: {
            displayName: 'John Doe',
            description: 'description',
            avatar: 'avatar',
          },
        })
      })
    model = new ProfilesViewModel(rootStore)
  })

  afterAll(() => {
    jest.clearAllMocks()
  })

  it('should call the getProfile & overwrite method', async () => {
    await model.getProfile('test did')
    expect(model.cache.get('test did')).toEqual({
      data: {
        avatar: 'avatar',
        description: 'description',
        displayName: 'John Doe',
      },
    })

    await model.overwrite('test did', {
      data: {
        did: 'test did2',
        declaration: {cid: '', actorType: ''},
        creator: '',
        followersCount: 0,
        followsCount: 0,
        membersCount: 0,
        postsCount: 0,
        handle: 'handle',
        displayName: 'John Doe 2',
        description: 'description 2',
        avatar: 'avatar 2',
      },
    } as unknown as GetProfile.Response)

    expect(model.cache.get('test did')).toEqual({
      data: {
        avatar: 'avatar 2',
        creator: '',
        declaration: {actorType: '', cid: ''},
        description: 'description 2',
        did: 'test did2',
        displayName: 'John Doe 2',
        followersCount: 0,
        followsCount: 0,
        handle: 'handle',
        membersCount: 0,
        postsCount: 0,
      },
    })

    await model.getProfile('test did')

    expect(model.cache.get('test did')).toEqual({
      data: {
        avatar: 'avatar 2',
        creator: '',
        declaration: {actorType: '', cid: ''},
        description: 'description 2',
        did: 'test did2',
        displayName: 'John Doe 2',
        followersCount: 0,
        followsCount: 0,
        handle: 'handle',
        membersCount: 0,
        postsCount: 0,
      },
    })
  })
})
