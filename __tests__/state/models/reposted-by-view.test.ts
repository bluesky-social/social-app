import {RepostedByViewModel} from '../../../src/state/models/reposted-by-view'
import {RootStoreModel} from '../../../src/state/models/root-store'
import {
  sessionClient,
  SessionServiceClient,
  AppBskyFeedGetRepostedBy as GetRepostedBy,
} from '@atproto/api'
import {DEFAULT_SERVICE} from '../../../src/state'

describe('RepostedByViewModel', () => {
  let model: RepostedByViewModel
  let rootStore: RootStoreModel
  let api: SessionServiceClient
  let requestSpy: jest.SpyInstance
  const params: GetRepostedBy.QueryParams = {
    uri: 'testuri',
  }
  const repostedBy = [
    {
      _reactKey: 'item-0',
      declaration: {
        actorType: '',
        cid: '',
      },
      did: '',
      displayName: '',
      handle: '',
      indexedAt: '',
      post: {
        uri: '',
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
    },
  ]

  beforeEach(() => {
    api = sessionClient.service(DEFAULT_SERVICE) as SessionServiceClient
    rootStore = new RootStoreModel(api)
    requestSpy = jest
      .spyOn(rootStore.api.app.bsky.feed, 'getRepostedBy')
      .mockImplementation((): Promise<any> => {
        return Promise.resolve({
          data: {
            repostedBy,
          },
        })
      })
    model = new RepostedByViewModel(rootStore, params)
  })

  afterAll(() => {
    jest.clearAllMocks()
  })

  it('should call the setup method', async () => {
    await model.setup()
    expect(requestSpy).toHaveBeenCalled()
    expect(model.repostedBy).toEqual(repostedBy)
    expect(model.hasLoaded).toEqual(true)
  })

  it('should call the refresh method', async () => {
    await model.refresh()
    expect(requestSpy).toHaveBeenCalled()
    expect(model.repostedBy).toEqual(repostedBy)
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
