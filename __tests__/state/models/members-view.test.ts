import {RootStoreModel} from '../../../src/state/models/root-store'
import {MembersViewModel} from '../../../src/state/models/members-view'
import {QueryParams} from '@atproto/api/dist/client/types/app/bsky/graph/getMembers'
import {APP_BSKY_GRAPH, sessionClient, SessionServiceClient} from '@atproto/api'
import {DEFAULT_SERVICE} from '../../../src/state'

describe('MembersViewModel', () => {
  let params: QueryParams
  let store: MembersViewModel
  let rootStore: RootStoreModel
  let api: SessionServiceClient

  beforeEach(() => {
    api = sessionClient.service(DEFAULT_SERVICE) as SessionServiceClient
    params = {actor: 'did:example:123'}
    rootStore = new RootStoreModel(api)
    store = new MembersViewModel(rootStore, params)
  })

  afterAll(() => {
    jest.clearAllMocks()
  })

  it('should call the setup method', async () => {
    const getMembersSpy = jest.spyOn(api.app.bsky.graph, 'getMembers')
    getMembersSpy.mockResolvedValueOnce({
      data: {
        subject: {did: '', declaration: {cid: '', actorType: ''}, handle: ''},
        members: [],
      },
    } as unknown as Promise<any>)
    await store.setup()
    expect(getMembersSpy).toHaveBeenCalledWith(params)
    expect(store.isLoading).toBe(false)
    expect(store.hasLoaded).toBe(true)
    expect(store.error).toBe('')
  })

  it('should call the refresh method', async () => {
    const getMembersSpy = jest.spyOn(api.app.bsky.graph, 'getMembers')
    getMembersSpy.mockResolvedValueOnce({
      data: {
        subject: {did: '', declaration: {cid: '', actorType: ''}, handle: ''},
        members: [],
      },
    } as unknown as Promise<any>)
    await store.refresh()
    expect(getMembersSpy).toHaveBeenCalledWith(params)
    expect(store.isLoading).toBe(false)
    expect(store.isRefreshing).toBe(false)
    expect(store.hasLoaded).toBe(true)
    expect(store.error).toBe('')
  })

  it('should call the setup method and handle errors correctly', async () => {
    const getMembersSpy = jest.spyOn(api.app.bsky.graph, 'getMembers')
    const error = new Error('test error')
    getMembersSpy.mockRejectedValueOnce(error)
    await store.setup()
    expect(getMembersSpy).toHaveBeenCalledWith(params)
    expect(store.isLoading).toBe(false)
    expect(store.hasLoaded).toBe(true)
    expect(store.error).toBe(error.toString())
  })

  it('should call the refresh method and handle errors correctly', async () => {
    const getMembersSpy = jest.spyOn(api.app.bsky.graph, 'getMembers')
    const error = new Error('test error')
    getMembersSpy.mockRejectedValueOnce(error)
    await store.refresh()
    expect(getMembersSpy).toHaveBeenCalledWith(params)
    expect(store.isLoading).toBe(false)
    expect(store.isRefreshing).toBe(false)
    expect(store.hasLoaded).toBe(true)
    expect(store.error).toBe(error.toString())
  })

  it('should call the removeMember method', async () => {
    const getAssertionsSpy = jest.spyOn(api.app.bsky.graph, 'getAssertions')
    const deleteAssertionSpy = jest.spyOn(
      api.app.bsky.graph.assertion,
      'delete',
    )
    getAssertionsSpy.mockResolvedValueOnce({
      data: {
        assertions: [
          {
            uri: 'testuri',
            cid: '',
            author: {
              did: '',
              declaration: {cid: '', actorType: ''},
              handle: '',
            },
            indexedAt: '',
            createdAt: '',
            subject: {
              did: '',
              declaration: {cid: '', actorType: ''},
              handle: '',
            },
            assertion: '',
          },
        ],
      },
    } as unknown as Promise<any>)
    deleteAssertionSpy.mockResolvedValueOnce()
    const did = 'did1'
    await store.removeMember(did)
    expect(getAssertionsSpy).toHaveBeenCalledWith({
      author: store.subject.did,
      subject: did,
      assertion: APP_BSKY_GRAPH.AssertMember,
    })
    expect(store.members.find(m => m.did === did)).toBeUndefined()
  })

  it('should call the removeMember method and  handle errors correctly', async () => {
    const getAssertionsSpy = jest.spyOn(api.app.bsky.graph, 'getAssertions')
    const error = new Error('test error')
    getAssertionsSpy.mockRejectedValueOnce(error)
    const did = 'did1'
    try {
      await store.removeMember(did)
    } catch (err) {
      expect(err).toBe(error)
    }
    expect(getAssertionsSpy).toHaveBeenCalledWith({
      author: store.subject.did,
      subject: did,
      assertion: APP_BSKY_GRAPH.AssertMember,
    })
  })

  it('should call the removeMember method and handle empty assertions', async () => {
    const getAssertionsSpy = jest.spyOn(api.app.bsky.graph, 'getAssertions')
    // @ts-expect-error
    getAssertionsSpy.mockResolvedValueOnce({data: {assertions: []}})
    const did = 'did1'
    try {
      await store.removeMember(did)
    } catch (err: any) {
      expect(err.message).toBe('Could not find membership record')
    }
    expect(getAssertionsSpy).toHaveBeenCalledWith({
      author: store.subject.did,
      subject: did,
      assertion: APP_BSKY_GRAPH.AssertMember,
    })
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
    store.members = [
      {
        did: 'did1',
        declaration: {cid: '', actorType: ''},
        handle: '',
        indexedAt: '',
        createdAt: '',
        _reactKey: '1',
      },
    ]
    expect(store.isMember('did1')).toEqual({
      did: 'did1',
      declaration: {cid: '', actorType: ''},
      handle: '',
      indexedAt: '',
      createdAt: '',
      _reactKey: '1',
    })
    expect(store.isMember('did2')).toBeUndefined()
  })
})
