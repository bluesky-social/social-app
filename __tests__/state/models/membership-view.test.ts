import {RootStoreModel} from '../../../src/state/models/root-store'
import {MembershipsViewModel} from '../../../src/state/models/memberships-view'
import {QueryParams} from '@atproto/api/dist/client/types/app/bsky/graph/getMemberships'
import {sessionClient, SessionServiceClient} from '@atproto/api'
import {DEFAULT_SERVICE} from '../../../src/state'

describe('MembershipsViewModel', () => {
  let params: QueryParams
  let store: MembershipsViewModel
  let rootStore: RootStoreModel
  let api: SessionServiceClient

  beforeEach(() => {
    api = sessionClient.service(DEFAULT_SERVICE) as SessionServiceClient
    params = {actor: 'did:example:123'}
    rootStore = new RootStoreModel(api)
    store = new MembershipsViewModel(rootStore, params)
  })

  afterAll(() => {
    jest.clearAllMocks()
  })

  it('should call the setup method', async () => {
    const getMembershipsSpy = jest.spyOn(api.app.bsky.graph, 'getMemberships')
    getMembershipsSpy.mockResolvedValueOnce({
      data: {
        subject: {did: '', declaration: {cid: '', actorType: ''}, handle: ''},
        memberships: [],
      },
    } as unknown as Promise<any>)
    await store.setup()
    expect(getMembershipsSpy).toHaveBeenCalledWith(params)
    expect(store.isLoading).toBe(false)
    expect(store.hasLoaded).toBe(true)
    expect(store.error).toBe('')
  })

  it('should call the refresh method', async () => {
    const getMembershipsSpy = jest.spyOn(api.app.bsky.graph, 'getMemberships')
    getMembershipsSpy.mockResolvedValueOnce({
      data: {
        subject: {did: '', declaration: {cid: '', actorType: ''}, handle: ''},
        memberships: [],
      },
    } as unknown as Promise<any>)
    await store.refresh()
    expect(getMembershipsSpy).toHaveBeenCalledWith(params)
    expect(store.isLoading).toBe(false)
    expect(store.isRefreshing).toBe(false)
    expect(store.hasLoaded).toBe(true)
    expect(store.error).toBe('')
  })

  it('should call the setup method and handle errors correctly', async () => {
    const getMembershipsSpy = jest.spyOn(api.app.bsky.graph, 'getMemberships')
    const error = new Error('test error')
    getMembershipsSpy.mockRejectedValueOnce(error)
    await store.setup()
    expect(getMembershipsSpy).toHaveBeenCalledWith(params)
    expect(store.isLoading).toBe(false)
    expect(store.hasLoaded).toBe(true)
    expect(store.error).toBe('Error: test error')
  })

  it('should call the hasContent getter', () => {
    expect(store.hasContent).toBe(false)
  })

  it('should call the hasError getter', () => {
    expect(store.hasError).toBe(false)
  })

  it('should call the isEmpty getter', () => {
    expect(store.isEmpty).toBe(false)
  })

  it('should call the isMember method', () => {
    store.memberships = [
      {
        did: 'did1',
        declaration: {cid: '', actorType: ''},
        handle: '',
        indexedAt: '',
        createdAt: '',
        _reactKey: '1',
      },
    ]
    expect(store.isMemberOf('did1')).toEqual(true)
    expect(store.isMemberOf('did2')).toEqual(false)
  })
})
