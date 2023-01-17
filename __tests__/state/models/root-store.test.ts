import {RootStoreModel} from '../../../src/state/models/root-store'
import {setupState} from '../../../src/state'

describe('rootStore', () => {
  let rootStore: RootStoreModel

  beforeAll(() => {
    jest.useFakeTimers()
  })

  beforeEach(async () => {
    rootStore = await setupState()
  })

  afterAll(() => {
    jest.clearAllMocks()
  })

  it('resolveName() handles inputs correctly', () => {
    const spyMethod = jest
      .spyOn(rootStore.api.com.atproto.handle, 'resolve')
      .mockResolvedValue({success: true, headers: {}, data: {did: 'testdid'}})

    rootStore.resolveName('teststring')
    expect(spyMethod).toHaveBeenCalledWith({handle: 'teststring'})

    expect(rootStore.resolveName('')).rejects.toThrow('Invalid handle: ""')

    expect(rootStore.resolveName('did:123')).resolves.toReturnWith('did:123')
  })

  it('should call the clearAll() resets state correctly', () => {
    rootStore.clearAll()

    expect(rootStore.session.data).toEqual(null)
    expect(rootStore.nav.tabs).toEqual([
      {
        fixedTabPurpose: 0,
        history: [
          {
            id: expect.anything(),
            ts: expect.anything(),
            url: '/',
          },
        ],
        id: expect.anything(),
        index: 0,
        isNewTab: false,
      },
      {
        fixedTabPurpose: 1,
        history: [
          {
            id: expect.anything(),
            ts: expect.anything(),
            url: '/notifications',
          },
        ],
        id: expect.anything(),
        index: 0,
        isNewTab: false,
      },
    ])
    expect(rootStore.nav.tabIndex).toEqual(0)
    expect(rootStore.me.did).toEqual('')
    expect(rootStore.me.handle).toEqual('')
    expect(rootStore.me.displayName).toEqual('')
    expect(rootStore.me.description).toEqual('')
    expect(rootStore.me.avatar).toEqual('')
    expect(rootStore.me.notificationCount).toEqual(0)
    expect(rootStore.me.memberships).toBeUndefined()
  })
})
