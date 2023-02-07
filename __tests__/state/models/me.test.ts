import {createServer, TestPDS} from '../../../jest/test-pds'
import {RootStoreModel, setupState} from '../../../src/state'
import {NotificationsViewModel} from '../../../src/state/models/notifications-view'

describe('MeModel', () => {
  let pds: TestPDS | undefined
  let rootStore: RootStoreModel
  beforeAll(async () => {
    jest.useFakeTimers()
    pds = await createServer()
    rootStore = await setupState(pds.pdsUrl)
  })

  afterAll(async () => {
    jest.clearAllMocks()
    await pds?.close()
  })

  it('should clear() correctly', () => {
    rootStore.me.did = '123'
    rootStore.me.handle = 'handle'
    rootStore.me.displayName = 'John Doe'
    rootStore.me.description = 'description'
    rootStore.me.avatar = 'avatar'
    rootStore.me.notificationCount = 1
    rootStore.me.clear()
    expect(rootStore.me.did).toEqual('')
    expect(rootStore.me.handle).toEqual('')
    expect(rootStore.me.displayName).toEqual('')
    expect(rootStore.me.description).toEqual('')
    expect(rootStore.me.avatar).toEqual('')
    expect(rootStore.me.notificationCount).toEqual(0)
  })

  it('should hydrate() successfully with valid properties', () => {
    rootStore.me.clear()
    rootStore.me.hydrate({
      did: '123',
      handle: 'handle',
      displayName: 'John Doe',
      description: 'description',
      avatar: 'avatar',
    })
    expect(rootStore.me.did).toEqual('123')
    expect(rootStore.me.handle).toEqual('handle')
    expect(rootStore.me.displayName).toEqual('John Doe')
    expect(rootStore.me.description).toEqual('description')
    expect(rootStore.me.avatar).toEqual('avatar')
  })

  it('should not hydrate() with invalid properties', () => {
    rootStore.me.clear()
    rootStore.me.hydrate({
      did: '',
      handle: 'handle',
      displayName: 'John Doe',
      description: 'description',
      avatar: 'avatar',
    })
    expect(rootStore.me.did).toEqual('')
    expect(rootStore.me.handle).toEqual('')
    expect(rootStore.me.displayName).toEqual('')
    expect(rootStore.me.description).toEqual('')
    expect(rootStore.me.avatar).toEqual('')

    rootStore.me.hydrate({
      did: '123',
      displayName: 'John Doe',
      description: 'description',
      avatar: 'avatar',
    })
    expect(rootStore.me.did).toEqual('')
    expect(rootStore.me.handle).toEqual('')
    expect(rootStore.me.displayName).toEqual('')
    expect(rootStore.me.description).toEqual('')
    expect(rootStore.me.avatar).toEqual('')
  })

  it('should serialize() key information', () => {
    rootStore.me.did = '123'
    rootStore.me.handle = 'handle'
    rootStore.me.displayName = 'John Doe'
    rootStore.me.description = 'description'
    rootStore.me.avatar = 'avatar'

    expect(rootStore.me.serialize()).toEqual({
      did: '123',
      handle: 'handle',
      displayName: 'John Doe',
      description: 'description',
      avatar: 'avatar',
    })
  })

  it('should load() successfully', async () => {
    await rootStore.session.login({
      service: pds?.pdsUrl || '',
      identifier: 'alice.test',
      password: 'hunter2',
    })

    await rootStore.me.load()
    expect(typeof rootStore.me.did).toEqual('string')
    expect(rootStore.me.handle).toEqual('alice.test')
    expect(rootStore.me.displayName).toEqual('Alice')
    expect(rootStore.me.description).toEqual('Test user 1')
    expect(rootStore.me.avatar).toEqual('')
  })

  it('should load() successfully without profile data', async () => {
    jest
      .spyOn(rootStore.api.app.bsky.actor, 'getProfile')
      .mockImplementationOnce((): Promise<any> => {
        return Promise.resolve({
          data: null,
        })
      })
    await rootStore.me.load()
    expect(typeof rootStore.me.did).toEqual('string')
    expect(rootStore.me.handle).toEqual('alice.test')
    expect(rootStore.me.displayName).toEqual('')
    expect(rootStore.me.description).toEqual('')
    expect(rootStore.me.avatar).toEqual('')
  })

  it('should load() to nothing when no session', async () => {
    await rootStore.session.logout()
    await rootStore.me.load()
    expect(rootStore.me.did).toEqual('')
    expect(rootStore.me.handle).toEqual('')
    expect(rootStore.me.displayName).toEqual('')
    expect(rootStore.me.description).toEqual('')
    expect(rootStore.me.avatar).toEqual('')
    expect(rootStore.me.notificationCount).toEqual(0)
  })

  it('should clearNotificationCount() successfully', () => {
    rootStore.me.clearNotificationCount()
    expect(rootStore.me.notificationCount).toBe(0)
  })

  it('should update notifs count with fetchStateUpdate()', async () => {
    rootStore.me.notifications = {
      refresh: jest.fn().mockResolvedValue({}),
    } as unknown as NotificationsViewModel

    jest
      .spyOn(rootStore.api.app.bsky.notification, 'getCount')
      .mockImplementationOnce((): Promise<any> => {
        return Promise.resolve({
          data: {
            count: 1,
          },
        })
      })

    await rootStore.me.fetchNotifications()
    expect(rootStore.me.notificationCount).toBe(1)
    expect(rootStore.me.notifications.refresh).toHaveBeenCalled()
  })
})
