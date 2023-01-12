import {
  UserFollowersViewModel,
  FollowerItem,
} from '../../../src/state/models/user-followers-view'
import {RootStoreModel} from '../../../src/state/models/root-store'
import {
  AppBskyGraphGetFollowers as GetFollowers,
  sessionClient,
  SessionServiceClient,
} from '@atproto/api'
import {DEFAULT_SERVICE} from '../../../src/state'

describe('UserFollowersViewModel', () => {
  let model: UserFollowersViewModel
  let rootStore: RootStoreModel
  let api: SessionServiceClient
  let requestSpy: jest.SpyInstance
  const params: GetFollowers.QueryParams = {
    user: 'did:example:123',
  }
  const subject = {
    did: 'did:example:123',
    handle: 'handle',
    declaration: {cid: '', actorType: ''},
  }
  const followers: FollowerItem[] = [
    {
      _reactKey: 'item-0',
      did: 'did:example:456',
      handle: 'handle',
      displayName: 'Example User',
      declaration: {cid: '', actorType: ''},
      indexedAt: '',
      createdAt: '',
    },
    {
      _reactKey: 'item-1',
      did: 'did:example:789',
      handle: 'handle',
      displayName: 'Example User',
      declaration: {cid: '', actorType: ''},
      indexedAt: '',
      createdAt: '',
    },
  ]

  beforeEach(() => {
    api = sessionClient.service(DEFAULT_SERVICE) as SessionServiceClient
    rootStore = new RootStoreModel(api)
    requestSpy = jest
      .spyOn(rootStore.api.app.bsky.graph, 'getFollowers')
      .mockImplementation((): Promise<any> => {
        return Promise.resolve({
          data: {
            subject,
            followers,
          },
        })
      })
    model = new UserFollowersViewModel(rootStore, params)
  })

  afterAll(() => {
    jest.clearAllMocks()
  })

  it('should call the setup method', async () => {
    await model.setup()
    expect(requestSpy).toHaveBeenCalled()
    expect(model.subject).toEqual(subject)
    expect(model.followers).toEqual(followers)
    expect(model.hasLoaded).toEqual(true)
  })

  it('should call the refresh method', async () => {
    await model.refresh()
    expect(requestSpy).toHaveBeenCalled()
    expect(model.subject).toEqual(subject)
    expect(model.followers).toEqual(followers)
    expect(model.hasLoaded).toEqual(true)
  })

  it('should call the hasContent getter', () => {
    expect(model.hasContent).toBe(false)
  })

  it('should call the hasError getter', () => {
    expect(model.hasError).toBe(false)
  })

  it('should call the isEmpty getter', () => {
    expect(model.isEmpty).toBe(false)
  })
})
