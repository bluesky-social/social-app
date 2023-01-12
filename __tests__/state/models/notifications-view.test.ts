import {DEFAULT_SERVICE, RootStoreModel} from '../../../src/state'
import {
  NotificationsViewItemModel,
  NotificationsViewModel,
} from '../../../src/state/models/notifications-view'
import {sessionClient, SessionServiceClient} from '@atproto/api'

describe('NotificationsViewModel', () => {
  let rootStore: RootStoreModel
  let model: NotificationsViewModel
  let api: SessionServiceClient
  let requestSpy: jest.SpyInstance

  beforeEach(() => {
    api = sessionClient.service(DEFAULT_SERVICE) as SessionServiceClient
    rootStore = new RootStoreModel(api)
    model = new NotificationsViewModel(rootStore, {})

    requestSpy = jest
      .spyOn(rootStore.api.app.bsky.notification, 'updateSeen')
      .mockImplementation((): Promise<any> => {
        return Promise.resolve()
      })
  })

  afterAll(() => {
    jest.clearAllMocks()
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

  it('should call the setup method', async () => {
    await model.setup()
    expect(model.isRefreshing).toBe(false)
  })

  it('should call the refresh method', async () => {
    await model.refresh()
    expect(model.isRefreshing).toBe(false)
  })

  it('should call the loadMore method', async () => {
    await model.loadMore()
    expect(model.isRefreshing).toBe(false)
  })

  it('should call the update method', async () => {
    await model.update()
    expect(model.isRefreshing).toBe(false)
  })

  it('updateReadState calls updateSeen on the api and clears the notification count', async () => {
    await model.updateReadState()
    expect(requestSpy).toHaveBeenCalled()
  })
})

describe('NotificationsViewItemModel', () => {
  let rootStore: RootStoreModel
  let model: NotificationsViewItemModel
  let api: SessionServiceClient

  const groupedNotification = {
    uri: '',
    cid: '',
    author: {
      did: '',
      handle: '',
      avatar: '',
      declaration: {cid: '', actorType: ''},
    },
    reason: '',
    reasonSubject: '',
    record: {},
    isRead: false,
    indexedAt: '',
  }

  beforeEach(() => {
    api = sessionClient.service(DEFAULT_SERVICE) as SessionServiceClient
    rootStore = new RootStoreModel(api)
    model = new NotificationsViewItemModel(
      rootStore,
      'item-1',
      groupedNotification,
    )
  })

  it('should call the isUpvote getter', () => {
    groupedNotification.reason = 'vote'
    model.copy(groupedNotification)
    expect(model.isUpvote).toBe(true)

    groupedNotification.reason = 'repost'
    model.copy(groupedNotification)
    expect(model.isUpvote).toBe(false)
  })

  it('should call the isRepost getter', () => {
    groupedNotification.reason = 'repost'
    model.copy(groupedNotification)
    expect(model.isRepost).toBe(true)

    groupedNotification.reason = 'vote'
    model.copy(groupedNotification)
    expect(model.isRepost).toBe(false)
  })

  it('should call the isTrend getter', () => {
    groupedNotification.reason = 'trend'
    model.copy(groupedNotification)
    expect(model.isTrend).toBe(true)

    groupedNotification.reason = 'vote'
    model.copy(groupedNotification)
    expect(model.isTrend).toBe(false)
  })

  it('should call the isMentiongetter', () => {
    groupedNotification.reason = 'vote'
    model.copy(groupedNotification)
    expect(model.isMention).toBe(false)
  })

  it('should call the isReply getter', () => {
    groupedNotification.reason = 'reply'
    model.copy(groupedNotification)
    expect(model.isReply).toBe(true)

    groupedNotification.reason = 'vote'
    model.copy(groupedNotification)
    expect(model.isReply).toBe(false)
  })

  it('should call the isFollow getter', () => {
    groupedNotification.reason = 'follow'
    model.copy(groupedNotification)
    expect(model.isFollow).toBe(true)

    groupedNotification.reason = 'vote'
    model.copy(groupedNotification)
    expect(model.isFollow).toBe(false)
  })

  it('should call the isAssertion getter', () => {
    groupedNotification.reason = 'assertion'
    model.copy(groupedNotification)
    expect(model.isAssertion).toBe(true)

    groupedNotification.reason = 'vote'
    model.copy(groupedNotification)
    expect(model.isAssertion).toBe(false)
  })

  it('should call the needsAdditionalData getter', () => {
    groupedNotification.reason = 'vote'
    model.copy(groupedNotification)
    expect(model.needsAdditionalData).toBe(true)

    groupedNotification.reason = 'vote'
    // @ts-expect-error
    model.additionalPost = {}
    model.copy(groupedNotification)
    expect(model.needsAdditionalData).toBe(false)
  })

  it('should call the isInvite getter', () => {
    groupedNotification.reason = 'assertion'
    groupedNotification.record = {
      assertion: 'AssertAdmin',
    }
    model.copy(groupedNotification)
    expect(model.isInvite).toBe(false)
  })

  it('should call the subjectUri getter', () => {
    groupedNotification.reasonSubject = 'test'
    model.copy(groupedNotification)
    expect(model.subjectUri).toBe('test')

    groupedNotification.record = {
      type: 'AppBskyFeedRepost',
      subject: {uri: 'test'},
    }
    model.copy(groupedNotification)
    expect(model.subjectUri).toBe('test')

    groupedNotification.record = {
      type: 'AppBskyFeedTrend',
      subject: {uri: 'test'},
    }
    model.copy(groupedNotification)
    expect(model.subjectUri).toBe('test')
  })

  it('should call the fetchAdditionalData method', async () => {
    groupedNotification.reason = 'vote'
    model.copy(groupedNotification)
    await model.fetchAdditionalData()
    expect(model.additionalPost).toEqual({
      isLoading: false,
      isRefreshing: false,
      hasLoaded: true,
      error: 'Error: ReferenceError: fetch is not defined',
      notFound: false,
      resolvedUri: 'at://test/',
      params: {
        uri: 'test',
        depth: 0,
      },
      rootStore,
    })
  })
})
