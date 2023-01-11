import {RootStoreModel} from '../../../src/state/models/root-store'
import {MeModel} from '../../../src/state/models/me'
import {MembershipsViewModel} from './../../../src/state/models/memberships-view'
import {NotificationsViewModel} from './../../../src/state/models/notifications-view'
import {sessionClient, SessionServiceClient} from '@atproto/api'
import {DEFAULT_SERVICE} from './../../../src/state/index'

describe('MeModel', () => {
  let rootStore: RootStoreModel
  let meModel: MeModel

  beforeEach(() => {
    const api = sessionClient.service(DEFAULT_SERVICE) as SessionServiceClient
    rootStore = new RootStoreModel(api)
    meModel = new MeModel(rootStore)
  })

  afterAll(() => {
    jest.clearAllMocks()
  })

  it('should call the clear method', () => {
    meModel.did = '123'
    meModel.handle = 'handle'
    meModel.displayName = 'John Doe'
    meModel.description = 'description'
    meModel.avatar = 'avatar'
    meModel.notificationCount = 1
    meModel.clear()
    expect(meModel.did).toEqual('')
    expect(meModel.handle).toEqual('')
    expect(meModel.displayName).toEqual('')
    expect(meModel.description).toEqual('')
    expect(meModel.avatar).toEqual('')
    expect(meModel.notificationCount).toEqual(0)
    expect(meModel.memberships).toBeUndefined()
  })

  it('should call the hydrate method with valid properties', () => {
    meModel.hydrate({
      did: '123',
      handle: 'handle',
      displayName: 'John Doe',
      description: 'description',
      avatar: 'avatar',
    })
    expect(meModel.did).toEqual('123')
    expect(meModel.handle).toEqual('handle')
    expect(meModel.displayName).toEqual('John Doe')
    expect(meModel.description).toEqual('description')
    expect(meModel.avatar).toEqual('avatar')
  })

  it('should call the hydrate method with invalid properties', () => {
    meModel.hydrate({
      did: '',
      handle: 'handle',
      displayName: 'John Doe',
      description: 'description',
      avatar: 'avatar',
    })
    expect(meModel.did).toEqual('')
    expect(meModel.handle).toEqual('')
    expect(meModel.displayName).toEqual('')
    expect(meModel.description).toEqual('')
    expect(meModel.avatar).toEqual('')

    meModel.hydrate({
      did: '123',
      displayName: 'John Doe',
      description: 'description',
      avatar: 'avatar',
    })
    expect(meModel.did).toEqual('')
    expect(meModel.handle).toEqual('')
    expect(meModel.displayName).toEqual('')
    expect(meModel.description).toEqual('')
    expect(meModel.avatar).toEqual('')
  })

  it('should call the load method', async () => {
    jest
      .spyOn(rootStore.api.app.bsky.actor, 'getProfile')
      .mockImplementationOnce((): Promise<any> => {
        return Promise.resolve({
          data: {
            displayName: 'John Doe',
            description: 'description',
            avatar: 'avatar',
          },
        })
      })
    rootStore.session.data = {
      did: '123',
      handle: 'handle',
      service: 'test service',
      accessJwt: 'test token',
      refreshJwt: 'test token',
    }
    await meModel.load()
    expect(meModel.did).toEqual('123')
    expect(meModel.handle).toEqual('handle')
    expect(meModel.displayName).toEqual('John Doe')
    expect(meModel.description).toEqual('description')
    expect(meModel.avatar).toEqual('avatar')
  })

  it('should call the load method, without profile data', async () => {
    jest
      .spyOn(rootStore.api.app.bsky.actor, 'getProfile')
      .mockImplementationOnce((): Promise<any> => {
        return Promise.resolve({
          data: null,
        })
      })
    rootStore.session.data = {
      did: '123',
      handle: 'handle',
      service: 'test service',
      accessJwt: 'test token',
      refreshJwt: 'test token',
    }
    await meModel.load()
    expect(meModel.did).toEqual('123')
    expect(meModel.handle).toEqual('handle')
    expect(meModel.displayName).toEqual('')
    expect(meModel.description).toEqual('')
    expect(meModel.avatar).toEqual('')
  })

  it('should call the load method without session', async () => {
    rootStore.session.data = null
    await meModel.load()
    expect(meModel.did).toEqual('')
    expect(meModel.handle).toEqual('')
    expect(meModel.displayName).toEqual('')
    expect(meModel.description).toEqual('')
    expect(meModel.avatar).toEqual('')
    expect(meModel.notificationCount).toEqual(0)
    expect(meModel.memberships).toBeUndefined()
  })

  it('should call the serialize method', () => {
    meModel.did = '123'
    meModel.handle = 'handle'
    meModel.displayName = 'John Doe'
    meModel.description = 'description'
    meModel.avatar = 'avatar'

    expect(meModel.serialize()).toEqual({
      did: '123',
      handle: 'handle',
      displayName: 'John Doe',
      description: 'description',
      avatar: 'avatar',
    })
  })

  it('should call the clearNotificationCount method', () => {
    meModel.clearNotificationCount()
    expect(meModel.notificationCount).toBe(0)
  })

  it('should call the fetchStateUpdate method', async () => {
    meModel.notifications = {
      refresh: jest.fn(),
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

    await meModel.fetchStateUpdate()
    expect(meModel.notificationCount).toBe(1)
    expect(meModel.notifications.refresh).toHaveBeenCalled()
  })

  it('should call the refreshMemberships method', async () => {
    meModel.memberships = {
      refresh: jest.fn(),
    } as unknown as MembershipsViewModel

    await meModel.refreshMemberships()
    expect(meModel.memberships.refresh).toHaveBeenCalled()
  })
})
