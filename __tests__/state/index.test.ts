import {RootStoreModel} from './../../src/state/models/root-store'
import {DEFAULT_SERVICE} from './../../src/state/index'
import {setupState} from '../../src/state'
import {sessionClient, SessionServiceClient} from '@atproto/api'
import {act} from 'react-test-renderer'
import { NavigationTabModel } from '../../src/state/models/navigation'

describe('rootStore', () => {
  beforeAll(() => {
    jest.useFakeTimers()
  })

  it('tests setupState method', async () => {
    const spyOnApiService = jest.spyOn(sessionClient, 'service')

    await act(() => {
      setupState()
    })
    expect(spyOnApiService).toHaveBeenCalledWith(DEFAULT_SERVICE)
  })

  describe('testing rootStore methods', () => {
    let rootStore: RootStoreModel
    beforeAll(() => {
      const api = sessionClient.service(DEFAULT_SERVICE) as SessionServiceClient
      rootStore = new RootStoreModel(api)
    })

    it('tests resolveName', () => {
      const spyMethod = jest
        .spyOn(rootStore.api.com.atproto.handle, 'resolve')
        .mockResolvedValue({success: true, headers: {}, data: {did: 'testdid'}})

      rootStore.resolveName('teststring')
      expect(spyMethod).toHaveBeenCalledWith({handle: 'teststring'})

      expect(rootStore.resolveName('')).rejects.toThrow('Invalid handle: ""')

      expect(rootStore.resolveName('did:123')).resolves.toReturnWith('did:123')
    })

    it('tests hydrate & fetchStateUpdate', () => {
      expect(rootStore.fetchStateUpdate()).resolves.toReturnWith({})

      rootStore.hydrate({
        log: [
          {
            id: '0',
          },
          {
            id: '1',
          },
        ],
        session: {
          service: 'test',
          refreshJwt: 'test',
          accessJwt: 'test',
          handle: 'test',
          did: 'test',
        },
        nav: {},
        shell: {darkMode: true},
        me: {
          did: 'test',
          handle: 'test',
          displayName: 'test',
          description: 'test',
          avatar: 'test',
          notificationCount: 1,
        },
        onboard: {
          isOnboarding: true,
          stage: 'follows',
        },
      })

      act(() => {
        rootStore.serialize()
      })

      expect(rootStore.fetchStateUpdate()).resolves.toReturnWith({})
    })

    it('tests clearAll method', () => {
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
})
