import {VotesViewModel} from './../../../src/state/models/votes-view'
import {RootStoreModel} from '../../../src/state/models/root-store'
import {
  sessionClient,
  SessionServiceClient,
  AppBskyFeedGetVotes as GetVotes,
} from '@atproto/api'
import {DEFAULT_SERVICE} from '../../../src/state'

describe('VotesViewModel', () => {
  let model: VotesViewModel
  let rootStore: RootStoreModel
  let api: SessionServiceClient
  let requestSpy: jest.SpyInstance
  const params: GetVotes.QueryParams = {
    uri: 'testuri',
  }
  const votes = [
    {
      _reactKey: 'item-0',
      direction: 'up',
      indexedAt: '',
      createdAt: '',
      actor: {
        did: '',
        handle: '',
        declaration: {cid: '', actorType: ''},
      },
    },
    {
      _reactKey: 'item-1',
      direction: 'down',
      indexedAt: '',
      createdAt: '',
      actor: {
        did: '',
        handle: '',
        declaration: {cid: '', actorType: ''},
      },
    },
  ]

  beforeEach(() => {
    api = sessionClient.service(DEFAULT_SERVICE) as SessionServiceClient
    rootStore = new RootStoreModel(api)
    requestSpy = jest
      .spyOn(rootStore.api.app.bsky.feed, 'getVotes')
      .mockImplementation((): Promise<any> => {
        return Promise.resolve({
          data: {
            uri: '',
            votes,
          },
        })
      })
    model = new VotesViewModel(rootStore, params)
  })

  afterAll(() => {
    jest.clearAllMocks()
  })

  it('should call the setup method', async () => {
    await model.setup()
    expect(requestSpy).toHaveBeenCalled()
    expect(model.votes).toEqual(votes)
    expect(model.hasLoaded).toEqual(true)
  })

  it('should call the refresh method', async () => {
    await model.refresh()
    expect(requestSpy).toHaveBeenCalled()
    expect(model.votes).toEqual(votes)
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
