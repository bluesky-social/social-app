import {
  UserFollowsViewModel,
  FollowItem,
} from '../../../src/state/models/user-follows-view'
import {RootStoreModel} from '../../../src/state/models/root-store'
import {
  AppBskyGraphGetFollows as GetFollows,
  sessionClient,
  SessionServiceClient,
} from '@atproto/api'
import {DEFAULT_SERVICE} from '../../../src/state'

describe('UserFollowsViewModel', () => {
  let model: UserFollowsViewModel
  let rootStore: RootStoreModel
  let api: SessionServiceClient
  let requestSpy: jest.SpyInstance
  const params: GetFollows.QueryParams = {
    user: 'did:example:123',
  }
  const subject = {
    did: 'did:example:123',
    handle: 'handle',
    declaration: {cid: '', actorType: ''},
  }
  const follows: FollowItem[] = [
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
      .spyOn(rootStore.api.app.bsky.graph, 'getFollows')
      .mockImplementation((): Promise<any> => {
        return Promise.resolve({
          data: {
            subject,
            follows,
          },
        })
      })
    model = new UserFollowsViewModel(rootStore, params)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should call the setup method', async () => {
    await model.setup()
    expect(requestSpy).toHaveBeenCalled()
    expect(model.subject).toEqual(subject)
    expect(model.follows).toEqual(follows)
    expect(model.hasLoaded).toEqual(true)
  })

  it('should call the refresh method', async () => {
    await model.refresh()
    expect(requestSpy).toHaveBeenCalled()
    expect(model.subject).toEqual(subject)
    expect(model.follows).toEqual(follows)
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
