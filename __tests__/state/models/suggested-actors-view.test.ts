import {SuggestedActorsViewModel} from '../../../src/state/models/suggested-actors-view'
import {RootStoreModel} from '../../../src/state/models/root-store'
import {
  AppBskyActorGetSuggestions as GetSuggestions,
  sessionClient,
  SessionServiceClient,
} from '@atproto/api'
import {DEFAULT_SERVICE} from '../../../src/state'

describe('SuggestedActorsViewModel', () => {
  let model: SuggestedActorsViewModel
  let rootStore: RootStoreModel
  let api: SessionServiceClient
  const actors: GetSuggestions.Actor[] = [
    {
      _reactKey: 'item-0',
      did: 'did:example:456',
      handle: 'handle',
      displayName: 'Example User 1',
      declaration: {cid: '', actorType: ''},
      indexedAt: '',
      createdAt: '',
    },
    {
      _reactKey: 'item-1',
      did: 'did:example:789',
      handle: 'handle',
      displayName: 'Example User 2',
      declaration: {cid: '', actorType: ''},
      indexedAt: '',
      createdAt: '',
    },
  ]

  beforeEach(() => {
    api = sessionClient.service(DEFAULT_SERVICE) as SessionServiceClient
    rootStore = new RootStoreModel(api)
    jest
      .spyOn(rootStore.api.app.bsky.actor, 'getSuggestions')
      .mockImplementation((): Promise<any> => {
        return Promise.resolve({
          data: {
            actors,
          },
        })
      })
    model = new SuggestedActorsViewModel(rootStore)
  })

  it('should call the setup method', async () => {
    await model.setup()
    expect(model.suggestions).toEqual(actors)
    expect(model.hasLoaded).toEqual(true)
  })

  it('should call the refresh method', async () => {
    await model.refresh()
    expect(model.suggestions).toEqual(actors)
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
