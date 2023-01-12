import {DEFAULT_SERVICE, RootStoreModel} from '../../../src/state'
import {
  PostThreadViewModel,
  PostThreadViewPostModel,
} from '../../../src/state/models/post-thread-view'
import {sessionClient, SessionServiceClient} from '@atproto/api'
import * as apilib from '../../../src/state/lib/api'

describe('PostThreadViewModel', () => {
  let rootStore: RootStoreModel
  let model: PostThreadViewModel
  let api: SessionServiceClient
  let requestSpy: jest.SpyInstance

  const thread = {
    uri: 'testuri',
    cid: '',
    author: {
      did: 'did:example:456',
      declaration: {cid: '', actorType: ''},
      handle: '',
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
  }

  beforeEach(() => {
    api = sessionClient.service(DEFAULT_SERVICE) as SessionServiceClient
    rootStore = new RootStoreModel(api)
    model = new PostThreadViewModel(rootStore, {uri: 'testuri'})

    requestSpy = jest
      .spyOn(rootStore.api.app.bsky.feed, 'getPostThread')
      .mockImplementation((): Promise<any> => {
        return Promise.resolve({
          data: {
            thread,
          },
        })
      })
  })

  afterAll(() => {
    jest.clearAllMocks()
  })

  it('should call the setup method', async () => {
    await model.setup()
    expect(requestSpy).toHaveBeenCalled()
    expect(model.hasLoaded).toBe(true)
  })

  it('should call the update method', async () => {
    await model.update()
    expect(requestSpy).toHaveBeenCalled()
    expect(model.hasLoaded).toBe(true)
  })

  it('should call the refresh method', async () => {
    await model.refresh()
    expect(requestSpy).toHaveBeenCalled()
    expect(model.hasLoaded).toBe(true)
  })

  it('should call the hasContent getter', () => {
    expect(model.hasContent).toBe(false)
  })

  it('should call the hasError getter', () => {
    expect(model.hasError).toBe(false)
  })
})

describe('PostThreadViewPostModel', () => {
  let rootStore: RootStoreModel
  let model: PostThreadViewPostModel
  let api: SessionServiceClient
  let requestSpy: jest.SpyInstance
  let deleteRequestSpy: jest.SpyInstance

  const post = {
    uri: 'testuri',
    cid: '',
    author: {
      did: 'did:example:456',
      declaration: {cid: '', actorType: ''},
      handle: '',
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
  }

  beforeEach(() => {
    api = sessionClient.service(DEFAULT_SERVICE) as SessionServiceClient
    rootStore = new RootStoreModel(api)
    model = new PostThreadViewPostModel(rootStore, 'item-1', {post})

    requestSpy = jest
      .spyOn(rootStore.api.app.bsky.feed, 'setVote')
      .mockImplementation((): Promise<any> => {
        return Promise.resolve({
          data: {
            post,
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
    expect(requestSpy).toHaveBeenCalled()
    expect(model.post.upvoteCount).toBe(1)
    expect(model.post.downvoteCount).toBe(0)
    expect(model.post.repostCount).toBe(0)
  })

  it('should call the toggleDownvote method', async () => {
    await model.toggleDownvote()
    expect(requestSpy).toHaveBeenCalled()
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
})
