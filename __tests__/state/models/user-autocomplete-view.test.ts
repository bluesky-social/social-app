import {UserAutocompleteViewModel} from '../../../src/state/models/user-autocomplete-view'
import {RootStoreModel} from '../../../src/state/models/root-store'
import {
  AppBskyGraphGetFollows as GetFollows,
  AppBskyActorSearchTypeahead as SearchTypeahead,
  sessionClient,
  SessionServiceClient,
} from '@atproto/api'
import {DEFAULT_SERVICE} from '../../../src/state'

describe('UserAutocompleteViewModel', () => {
  let model: UserAutocompleteViewModel
  let rootStore: RootStoreModel
  let api: SessionServiceClient
  let requestSpy: jest.SpyInstance
  const follows: GetFollows.Follow[] = [
    {
      did: 'did:example:456',
      handle: 'handle',
      displayName: 'Example User 1',
      declaration: {cid: '', actorType: ''},
      indexedAt: '',
      createdAt: '',
    },
    {
      did: 'did:example:789',
      handle: 'handle',
      displayName: 'Example User 2',
      declaration: {cid: '', actorType: ''},
      indexedAt: '',
      createdAt: '',
    },
  ]
  const searchRes: SearchTypeahead.User[] = [
    {
      did: 'did:example:abc',
      handle: 'handle1',
      displayName: 'Example User 1',
      declaration: {cid: '', actorType: ''},
      indexedAt: '',
      createdAt: '',
    },
    {
      did: 'did:example:def',
      handle: 'handle2',
      displayName: 'Example User 2',
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
            follows,
          },
        })
      })
    jest
      .spyOn(rootStore.api.app.bsky.actor, 'searchTypeahead')
      .mockImplementation((): Promise<any> => {
        return Promise.resolve({
          data: {
            users: searchRes,
          },
        })
      })
    model = new UserAutocompleteViewModel(rootStore)
  })

  it('should call the setup method', async () => {
    await model.setup()
    expect(requestSpy).toHaveBeenCalled()
    expect(model.follows).toEqual(follows)
  })

  it('should call the setActive method', async () => {
    await model.setActive(true)
    expect(model.isActive).toEqual(true)
  })

  it('should call the setPrefix method', async () => {
    await model.setPrefix('test')
    expect(model.prefix).toEqual('test')
  })

  it('should call the suggestions getter', async () => {
    await model.setup()
    expect(model.suggestions).toEqual([])

    await model.setActive(true)
    expect(model.suggestions).toEqual([
      {
        displayName: 'Example User 1',
        handle: 'handle',
      },
      {
        displayName: 'Example User 2',
        handle: 'handle',
      },
    ])

    await model.setPrefix('prefix')
    expect(model.suggestions).toEqual([
      {
        displayName: 'Example User 1',
        handle: 'handle1',
      },
      {
        displayName: 'Example User 2',
        handle: 'handle2',
      },
    ])
  })
})
