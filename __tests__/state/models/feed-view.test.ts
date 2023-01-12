import {FeedItemModel, FeedModel} from './../../../src/state/models/feed-view'
import {RootStoreModel} from '../../../src/state/models/root-store'
import {MeModel} from '../../../src/state/models/me'
import {sessionClient, SessionServiceClient} from '@atproto/api'
import {DEFAULT_SERVICE} from './../../../src/state/index'
import * as apilib from '../../../src/state/lib/api'

describe('FeedModel', () => {
  let rootStore: RootStoreModel
  let meModel: MeModel
  let model: FeedModel

  let timelineRequestSpy: jest.SpyInstance

  const feed = [
    {
      _isThreadChild: false,
      _isThreadChildElided: false,
      _isThreadParent: false,
      _reactKey: 'item-0',
      post: {
        uri: 'testuri',
        cid: '',
        author: {
          did: 'did:example:456',
          handle: 'handle',
          displayName: 'Example User 1',
          declaration: {cid: '', actorType: ''},
          indexedAt: '',
          createdAt: '',
        },
        record: {},
        replyCount: 0,
        repostCount: 0,
        upvoteCount: 0,
        downvoteCount: 0,
        indexedAt: '',
        viewer: {
          repost: '',
          upvote: 'upvote',
          downvote: '',
        },
      },
      rootStore: expect.anything(),
    },
  ]

  beforeEach(() => {
    const api = sessionClient.service(DEFAULT_SERVICE) as SessionServiceClient
    rootStore = new RootStoreModel(api)
    meModel = new MeModel(rootStore)
    model = meModel.mainFeed
    timelineRequestSpy = jest
      .spyOn(rootStore.api.app.bsky.feed, 'getTimeline')
      .mockImplementation((): Promise<any> => {
        return Promise.resolve({
          data: {
            feed,
          },
        })
      })
  })

  afterAll(() => {
    jest.clearAllMocks()
  })

  it('should call the setup method', async () => {
    await model.setup()
    expect(timelineRequestSpy).toHaveBeenCalled()
    expect(model.feed).toEqual(feed)
    expect(model.hasLoaded).toEqual(true)
  })

  it('should call the refresh method', async () => {
    await model.refresh()
    expect(timelineRequestSpy).toHaveBeenCalled()
    expect(model.feed).toEqual([
      {
        ...feed[0],
        _reactKey: 'item-1',
      },
    ])
    expect(model.hasLoaded).toEqual(true)
  })

  it('should call the loadMore method', async () => {
    await model.loadMore()
    expect(timelineRequestSpy).toHaveBeenCalled()
    expect(model.feed).toEqual([
      {
        ...feed[0],
        _reactKey: 'item-2',
      },
    ])
    expect(model.hasLoaded).toEqual(true)
  })

  it('should call the loadLatest method', async () => {
    await model.loadLatest()
    expect(timelineRequestSpy).toHaveBeenCalled()
    expect(model.feed).toEqual([
      {
        ...feed[0],
        _reactKey: 'item-3',
      },
    ])
    expect(model.hasLoaded).toEqual(true)
  })

  it('should call the update method', async () => {
    await model.setup()
    await model.update()
    expect(timelineRequestSpy).toHaveBeenCalledTimes(2)
    expect(model.feed).toEqual([
      {
        ...feed[0],
        _reactKey: 'item-4',
      },
    ])
    expect(model.hasLoaded).toEqual(true)
  })

  it('should call the checkForLatest method', async () => {
    await model.checkForLatest()
    expect(timelineRequestSpy).toHaveBeenCalled()
    expect(model.hasNewLatest).toEqual(true)
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

  it('should call the nonReplyFeed getter', async () => {
    await model.setup()
    expect(model.nonReplyFeed).toEqual([
      {
        ...feed[0],
        _reactKey: 'item-5',
      },
    ])
  })
})

describe('FeedItemModel', () => {
  let rootStore: RootStoreModel
  let meModel: MeModel
  let feedModel: FeedModel
  let model: FeedItemModel

  let setVoteRequestSpy: jest.SpyInstance
  let deleteRequestSpy: jest.SpyInstance

  const feed = [
    {
      _isThreadChild: false,
      _isThreadChildElided: false,
      _isThreadParent: false,
      _reactKey: 'item-0',
      post: {
        uri: 'testuri',
        cid: '',
        author: {
          did: 'did:example:456',
          handle: 'handle',
          displayName: 'Example User 1',
          declaration: {cid: '', actorType: ''},
          indexedAt: '',
          createdAt: '',
        },
        record: {},
        replyCount: 0,
        repostCount: 0,
        upvoteCount: 0,
        downvoteCount: 0,
        indexedAt: '',
        viewer: {
          repost: '',
          upvote: '',
          downvote: '',
        },
      },
      rootStore: expect.anything(),
    },
  ]

  beforeEach(async () => {
    const api = sessionClient.service(DEFAULT_SERVICE) as SessionServiceClient
    rootStore = new RootStoreModel(api)
    meModel = new MeModel(rootStore)

    jest
      .spyOn(rootStore.api.app.bsky.feed, 'getTimeline')
      .mockImplementation((): Promise<any> => {
        return Promise.resolve({
          data: {
            feed,
          },
        })
      })
    feedModel = meModel.mainFeed
    await feedModel.setup()
    model = feedModel.feed[0]

    setVoteRequestSpy = jest
      .spyOn(rootStore.api.app.bsky.feed, 'setVote')
      .mockImplementation((): Promise<any> => {
        return Promise.resolve({
          data: {
            feed,
          },
        })
      })
    deleteRequestSpy = jest
      .spyOn(rootStore.api.app.bsky.feed.post, 'delete')
      .mockImplementation((): Promise<any> => {
        return Promise.resolve()
      })
  })

  afterAll(() => {
    jest.clearAllMocks()
  })

  it('should call the toggleUpvote method', async () => {
    await model.toggleUpvote()
    expect(setVoteRequestSpy).toHaveBeenCalled()
    expect(model.post.upvoteCount).toBe(1)
    expect(model.post.downvoteCount).toBe(0)
    expect(model.post.repostCount).toBe(0)
  })

  it('should call the toggleDownvote method', async () => {
    await model.toggleDownvote()
    expect(setVoteRequestSpy).toHaveBeenCalled()
    expect(model.post.upvoteCount).toBe(0)
    expect(model.post.downvoteCount).toBe(1)
    expect(model.post.repostCount).toBe(0)
  })

  it('should call the toggleRepost method', async () => {
    const repostSpy = jest.spyOn(apilib, 'repost').mockResolvedValue({
      uri: 'reposttesturi',
      cid: '',
    })
    await model.toggleRepost()
    expect(repostSpy).toHaveBeenCalled()
    expect(model.post.upvoteCount).toBe(0)
    expect(model.post.downvoteCount).toBe(0)
    expect(model.post.repostCount).toBe(1)
    expect(model.post.viewer.repost).toBe('reposttesturi')
  })

  it('should call the delete method', async () => {
    await model.delete()
    expect(deleteRequestSpy).toHaveBeenCalledWith({
      did: 'did:example:456',
      rkey: '',
    })
  })

  it('should call the reasonRepost getter', () => {
    expect(model.reasonRepost).toBeUndefined()
  })

  it('should call the reasonTrend getter', () => {
    expect(model.reasonTrend).toBeUndefined()
  })
})
