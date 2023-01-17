import {LogModel} from './../src/state/models/log'
import {LRUMap} from 'lru_map'
import {RootStoreModel} from './../src/state/models/root-store'
import {NavigationTabModel} from './../src/state/models/navigation'
import {SessionModel} from '../src/state/models/session'
import {NavigationModel} from '../src/state/models/navigation'
import {ShellUiModel} from '../src/state/models/shell-ui'
import {MeModel} from '../src/state/models/me'
import {OnboardModel} from '../src/state/models/onboard'
import {ProfilesViewModel} from '../src/state/models/profiles-view'
import {LinkMetasViewModel} from '../src/state/models/link-metas-view'
import {MembershipsViewModel} from '../src/state/models/memberships-view'
import {FeedModel} from '../src/state/models/feed-view'
import {NotificationsViewModel} from '../src/state/models/notifications-view'
import {ProfileViewModel} from '../src/state/models/profile-view'
import {MembersViewModel} from '../src/state/models/members-view'
import {ProfileUiModel, Sections} from '../src/state/models/profile-ui'
import {SessionServiceClient} from '@atproto/api'
import {UserAutocompleteViewModel} from '../src/state/models/user-autocomplete-view'
import {UserLocalPhotosModel} from '../src/state/models/user-local-photos'
import {SuggestedActorsViewModel} from '../src/state/models/suggested-actors-view'
import {UserFollowersViewModel} from '../src/state/models/user-followers-view'
import {UserFollowsViewModel} from '../src/state/models/user-follows-view'
import {NotificationsViewItemModel} from './../src/state/models/notifications-view'
import {
  PostThreadViewModel,
  PostThreadViewPostModel,
} from '../src/state/models/post-thread-view'
import {FeedItemModel} from '../src/state/models/feed-view'
import {RepostedByViewModel} from '../src/state/models/reposted-by-view'
import {VotesViewModel} from '../src/state/models/votes-view'

export const mockedProfileStore = {
  isLoading: false,
  isRefreshing: false,
  hasLoaded: true,
  error: '',
  params: {
    actor: '',
  },
  did: 'test did',
  handle: 'testhandle',
  declaration: {
    cid: '',
    actorType: '',
  },
  creator: 'test did',
  displayName: '',
  description: '',
  avatar: '',
  banner: '',
  followersCount: 0,
  followsCount: 0,
  membersCount: 0,
  postsCount: 0,
  myState: {
    follow: '',
    member: '',
  },
  rootStore: {} as RootStoreModel,
  hasContent: true,
  hasError: false,
  isEmpty: false,
  isUser: true,
  isScene: false,
  setup: jest.fn().mockResolvedValue({aborted: false}),
  refresh: jest.fn(),
  toggleFollowing: jest.fn().mockResolvedValue({}),
  updateProfile: jest.fn(),
  // unknown required because of the missing private methods: _xLoading, _xIdle, _load, _replaceAll
} as unknown as ProfileViewModel

export const mockedMembersStore = {
  isLoading: false,
  isRefreshing: false,
  hasLoaded: true,
  error: '',
  params: {
    actor: 'test actor',
  },
  subject: {
    did: 'test did',
    handle: '',
    displayName: '',
    declaration: {
      cid: '',
      actorType: '',
    },
    avatar: undefined,
  },
  members: [
    {
      did: 'test did2',
      declaration: {
        cid: '',
        actorType: '',
      },
      handle: 'testhandle',
      displayName: 'test name',
      indexedAt: '',
    },
  ],
  rootStore: {} as RootStoreModel,
  hasContent: true,
  hasError: false,
  isEmpty: false,
  isMember: jest.fn(),
  setup: jest.fn().mockResolvedValue({aborted: false}),
  refresh: jest.fn(),
  loadMore: jest.fn(),
  removeMember: jest.fn(),
  // unknown required because of the missing private methods: _xLoading, _xIdle, _fetch, _replaceAll, _append
} as unknown as MembersViewModel

export const mockedMembershipsStore = {
  isLoading: false,
  isRefreshing: false,
  hasLoaded: true,
  error: '',
  params: {
    actor: '',
    limit: 1,
    before: '',
  },
  subject: {
    did: 'test did',
    handle: '',
    displayName: '',
    declaration: {cid: '', actorType: ''},
    avatar: undefined,
  },
  memberships: [
    {
      did: 'test did',
      declaration: {
        cid: '',
        actorType: 'app.bsky.system.actorUser',
      },
      handle: ',',
      displayName: '',
      createdAt: '',
      indexedAt: '',
      _reactKey: 'item-1',
    },
  ],
  rootStore: {} as RootStoreModel,
  hasContent: true,
  hasError: false,
  isEmpty: false,
  isMemberOf: jest.fn(),
  setup: jest.fn().mockResolvedValue({aborted: false}),
  refresh: jest.fn(),
  loadMore: jest.fn(),
  // unknown required because of the missing private methods: _xLoading, _xIdle, _fetch, _replaceAll, _append
} as unknown as MembershipsViewModel

export const mockedFeedItemStore = {
  _reactKey: 'item-1',
  _isThreadParent: false,
  _isThreadChildElided: false,
  _isThreadChild: false,
  post: {
    uri: 'testuri',
    cid: 'test cid',
    author: {
      did: 'test did',
      handle: 'test.handle',
      displayName: 'test name',
      declaration: {cid: '', actorType: ''},
    },
    record: {
      $type: 'app.bsky.feed.post',
      createdAt: '2022-12-29T16:39:57.919Z',
      text: 'Sup',
    },
    replyCount: 0,
    repostCount: 0,
    upvoteCount: 0,
    downvoteCount: 0,
    indexedAt: '2022-12-29T16:39:57.919Z',
    viewer: {},
  },
  postRecord: {
    $type: 'app.bsky.feed.post',
    text: 'test text',
    createdAt: '1',
    reply: {
      root: {
        uri: 'testuri',
        cid: 'tes cid',
      },
      parent: {
        uri: 'testuri',
        cid: 'tes cid',
      },
    },
  },
  rootStore: {} as RootStoreModel,
  copy: jest.fn(),
  toggleUpvote: jest.fn().mockResolvedValue({}),
  toggleDownvote: jest.fn(),
  toggleRepost: jest.fn().mockResolvedValue({}),
  delete: jest.fn().mockResolvedValue({}),
  reasonRepost: {
    by: {
      did: 'test did',
      handle: 'test.handle',
      declaration: {cid: '', actorType: ''},
    },
    indexedAt: '',
  },
  reasonTrend: {
    by: {
      did: 'test did',
      handle: 'test.handle',
      declaration: {cid: '', actorType: ''},
    },
    indexedAt: '',
  },
  reply: {
    parent: {
      author: {
        did: 'test did',
        handle: 'test.handle',
        displayName: 'test name',
        declaration: {cid: '', actorType: ''},
      },
      cid: '',
      downvoteCount: 0,
      indexedAt: '2023-01-10T11:17:46.945Z',
      record: {},
      replyCount: 1,
      repostCount: 0,
      upvoteCount: 0,
      uri: 'testuri',
      viewer: {},
    },
    root: {
      author: {
        did: 'test did',
        handle: 'test.handle',
        displayName: 'test name',
        declaration: {cid: '', actorType: ''},
      },
      cid: '',
      downvoteCount: 0,
      indexedAt: '2023-01-10T11:17:46.739Z',
      record: {},
      replyCount: 1,
      repostCount: 0,
      upvoteCount: 1,
      uri: 'testuri',
      viewer: {},
    },
  },
} as FeedItemModel

export const mockedFeedStore = {
  isLoading: false,
  isRefreshing: false,
  hasNewLatest: false,
  hasLoaded: true,
  error: '',
  hasMore: true,
  params: {
    actor: '',
    limit: 1,
    before: '',
  },
  feed: [],
  rootStore: {} as RootStoreModel,
  feedType: 'home',
  hasContent: true,
  hasError: false,
  isEmpty: false,
  nonReplyFeed: [
    {
      _reactKey: 'item-1',
      post: {
        author: {
          handle: 'handle.test',
          displayName: 'test name',
          avatar: '',
        },
        cid: 'bafyreihkwjoy2vbfqld2lp3tv4ce6yfr354sqgp32qoplrudso4gyyjiwe',
        downvoteCount: 0,
        indexedAt: '2022-12-29T16:35:55.270Z',
        record: {
          $type: 'app.bsky.feed.post',
          createdAt: '2022-12-29T16:39:57.919Z',
          text: 'Sup',
        },
        replyCount: 0,
        repostCount: 0,
        upvoteCount: 0,
        uri: 'at://did:plc:wcizmlgv3rdslk64t6q4silu/app.bsky.feed.post/3jkzce5kfvn2h',
        viewer: {
          handle: 'handle.test',
          displayName: 'test name',
          avatar: '',
        },
      },
      reason: undefined,
      reply: undefined,
    },
  ],
  setHasNewLatest: jest.fn(),
  setup: jest.fn().mockResolvedValue({}),
  refresh: jest.fn().mockResolvedValue({}),
  loadMore: jest.fn().mockResolvedValue({}),
  loadLatest: jest.fn(),
  update: jest.fn(),
  checkForLatest: jest.fn().mockRejectedValue('Error checking for latest'),
  // unknown required because of the missing private methods: _xLoading, _xIdle, _pendingWork, _initialLoad, _loadLatest, _loadMore, _update, _replaceAll, _appendAll, _prependAll, _updateAll, _getFeed, loadMoreCursor, pollCursor, _loadPromise, _updatePromise, _loadLatestPromise, _loadMorePromise
} as unknown as FeedModel

export const mockedPostThreadViewPostStore = {
  _reactKey: 'item-1',
  _depth: 0,
  _isHighlightedPost: false,
  _hasMore: false,
  postRecord: {
    text: 'test text',
    createdAt: '',
    reply: {
      root: {
        uri: 'testuri',
        cid: 'tes cid',
      },
      parent: {
        uri: 'testuri',
        cid: 'tes cid',
      },
    },
  },
  post: {
    uri: 'testuri',
    cid: 'testcid',
    record: {},
    author: {
      did: 'test did',
      handle: 'test.handle',
      declaration: {cid: '', actorType: ''},
      viewer: {
        muted: true,
      },
    },
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
  rootStore: {} as RootStoreModel,
  assignTreeModels: jest.fn(),
  toggleRepost: jest.fn().mockRejectedValue({}),
  toggleUpvote: jest.fn().mockRejectedValue({}),
  toggleDownvote: jest.fn(),
  delete: jest.fn(),
} as PostThreadViewPostModel

export const mockedPostThreadViewStore = {
  isLoading: false,
  isRefreshing: false,
  hasLoaded: false,
  error: '',
  notFound: false,
  resolvedUri: 'testuri',
  params: {
    uri: 'testuri',
  },
  thread: mockedPostThreadViewPostStore,
  hasContent: true,
  hasError: false,
  setup: jest.fn(),
  refresh: jest.fn().mockResolvedValue({}),
  update: jest.fn(),
  // unknown required because of the missing private methods: _xLoading, _xIdle, _resolveUri, _load, _replaceAll
} as unknown as PostThreadViewModel

export const mockedNotificationsViewItemStore = {
  _reactKey: 'item-1',
  uri: 'testuri',
  cid: '',
  author: {
    did: 'test did',
    handle: 'test.handle',
    declaration: {cid: '', actorType: ''},
  },
  rootStore: {} as RootStoreModel,
  copy: jest.fn(),
  reason: 'test reason',
  isRead: true,
  indexedAt: '',
  isUpvote: true,
  isRepost: false,
  isTrend: false,
  isMention: false,
  isReply: false,
  isFollow: false,
  isAssertion: false,
  needsAdditionalData: false,
  isInvite: false,
  subjectUri: 'testuri',
  toSupportedRecord: jest.fn().mockReturnValue({
    text: 'test text',
    createdAt: '',
  }),
  fetchAdditionalData: jest.fn(),
} as NotificationsViewItemModel

export const mockedNotificationsStore = {
  isLoading: false,
  isRefreshing: false,
  hasLoaded: true,
  error: '',
  params: {
    limit: 1,
    before: '',
  },
  hasMore: true,
  notifications: [mockedNotificationsViewItemStore],
  rootStore: {} as RootStoreModel,
  hasContent: true,
  hasError: false,
  isEmpty: false,
  setup: jest.fn().mockResolvedValue({aborted: false}),
  refresh: jest.fn().mockResolvedValue({}),
  loadMore: jest.fn().mockResolvedValue({}),
  update: jest.fn().mockResolvedValue(null),
  updateReadState: jest.fn(),
  // unknown required because of the missing private methods: _xLoading, _xIdle, _pendingWork, _initialLoad, _loadMore, _update, _replaceAll, _appendAll, _updateAll, loadMoreCursor, _loadPromise, _updatePromise, _loadLatestPromise, _loadMorePromise
} as unknown as NotificationsViewModel

export const mockedSessionStore = {
  serialize: jest.fn(),
  hydrate: jest.fn(),
  data: {
    service: '',
    refreshJwt: '',
    accessJwt: '',
    handle: '',
    did: 'test did',
  },
  online: false,
  attemptingConnect: false,
  rootStore: {} as RootStoreModel,
  hasSession: true,
  clear: jest.fn(),
  setState: jest.fn(),
  setOnline: jest.fn(),
  updateAuthTokens: jest.fn(),
  connect: jest.fn(),
  describeService: jest.fn().mockResolvedValue({
    availableUserDomains: ['test'],
    links: {
      termsOfService: 'https://testTermsOfService',
      privacyPolicy: 'https://testPrivacyPolicy',
    },
  }),
  login: jest.fn(),
  createAccount: jest.fn(),
  logout: jest.fn(),

  // unknown required because of the missing private methods: _connectPromise, configureApi & _connect
} as unknown as SessionModel

export const mockedNavigationTabStore = {
  serialize: jest.fn(),
  hydrate: jest.fn(),
  id: 0,
  history: [
    {
      url: '',
      ts: 0,
      title: '',
      id: 0,
    },
  ],
  index: 0,
  isNewTab: false,
  current: {
    url: '',
    ts: 0,
    title: '',
    id: 0,
  },
  canGoBack: false,
  canGoForward: false,
  backTen: [
    {
      url: '',
      title: '',
      index: 0,
      id: 0,
    },
  ],
  forwardTen: [
    {
      url: '',
      title: '',
      index: 0,
      id: 0,
    },
  ],
  navigate: jest.fn(),
  refresh: jest.fn(),
  goBack: jest.fn(),
  fixedTabReset: jest.fn(),
  goForward: jest.fn(),
  goToIndex: jest.fn(),
  setTitle: jest.fn(),
  setIsNewTab: jest.fn(),
  fixedTabPurpose: 0,
  getBackList: () => [
    {
      url: '/',
      title: '',
      index: 1,
      id: 1,
    },
  ],
  getForwardList: jest.fn(),
} as NavigationTabModel

export const mockedNavigationStore = {
  serialize: jest.fn(),
  hydrate: jest.fn(),
  tabs: [mockedNavigationTabStore],
  tabIndex: 0,
  clear: jest.fn(),
  tab: mockedNavigationTabStore,
  tabCount: 1,
  isCurrentScreen: jest.fn(),
  navigate: jest.fn(),
  refresh: jest.fn(),
  setTitle: jest.fn(),
  handleLink: jest.fn(),
  switchTo: jest.fn(),
  setActiveTab: jest.fn(),
  closeTab: jest.fn(),
  newTab: jest.fn(),
} as NavigationModel

export const mockedShellStore = {
  serialize: jest.fn(),
  hydrate: jest.fn(),
  minimalShellMode: false,
  isMainMenuOpen: false,
  isModalActive: false,
  activeModal: undefined,
  isLightboxActive: false,
  activeLightbox: undefined,
  isComposerActive: false,
  composerOpts: undefined,
  darkMode: false,
  setDarkMode: jest.fn(),
  setMainMenuOpen: jest.fn(),
  setMinimalShellMode: jest.fn(),
  openModal: jest.fn(),
  closeModal: jest.fn(),
  closeComposer: jest.fn(),
  closeLightbox: jest.fn(),
  openComposer: jest.fn(),
  openLightbox: jest.fn(),
} as ShellUiModel

export const mockedMeStore = {
  serialize: jest.fn(),
  hydrate: jest.fn(),
  did: 'test did',
  handle: 'test',
  displayName: 'test',
  description: 'test',
  avatar: '',
  notificationCount: 0,
  rootStore: {} as RootStoreModel,
  memberships: mockedMembershipsStore,
  mainFeed: mockedFeedStore,
  notifications: mockedNotificationsStore,
  clear: jest.fn(),
  load: jest.fn(),
  clearNotificationCount: jest.fn(),
  fetchStateUpdate: jest.fn(),
  refreshMemberships: jest.fn(),
} as MeModel

export const mockedOnboardStore = {
  serialize: jest.fn(),
  hydrate: jest.fn(),
  isOnboarding: false,
  stage: '',
  start: jest.fn(),
  stop: jest.fn(),
  next: jest.fn(),
} as OnboardModel

export const mockedProfilesStore = {
  hydrate: jest.fn(),
  serialize: jest.fn(),
  cache: new LRUMap(100),
  rootStore: {} as RootStoreModel,
  getProfile: jest.fn().mockResolvedValue({data: {}}),
  overwrite: jest.fn(),
} as ProfilesViewModel

export const mockedLinkMetasStore = {
  hydrate: jest.fn(),
  serialize: jest.fn(),
  cache: new LRUMap(100),
  rootStore: {} as RootStoreModel,
  getLinkMeta: jest.fn(),
} as LinkMetasViewModel

export const mockedLogStore = {
  entries: [],
  serialize: jest.fn(),
  hydrate: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  // unknown required because of the missing private methods: add
} as unknown as LogModel

export const mockedRootStore = {
  api: {
    com: {},
    app: {
      bsky: {
        graph: {
          confirmation: {
            delete: jest.fn().mockResolvedValue({}),
          },
          getFollowers: jest.fn().mockResolvedValue({}),
          getMembers: jest.fn().mockResolvedValue({}),
        },
      },
    },
  } as unknown as SessionServiceClient,
  resolveName: jest.fn(),
  serialize: jest.fn(),
  hydrate: jest.fn(),
  fetchStateUpdate: jest.fn(),
  clearAll: jest.fn(),
  session: mockedSessionStore,
  nav: mockedNavigationStore,
  shell: mockedShellStore,
  me: mockedMeStore,
  onboard: mockedOnboardStore,
  profiles: mockedProfilesStore,
  linkMetas: mockedLinkMetasStore,
  log: mockedLogStore,
} as RootStoreModel

export const mockedProfileUiStore = {
  profile: mockedProfileStore,
  feed: mockedFeedStore,
  memberships: mockedMembershipsStore,
  members: mockedMembersStore,
  selectedViewIndex: 0,
  rootStore: mockedRootStore,
  params: {
    user: 'test user',
  },
  currentView: mockedFeedStore,
  isInitialLoading: false,
  isRefreshing: false,
  isUser: true,
  isScene: false,
  selectorItems: [Sections.Posts, Sections.PostsWithReplies, Sections.Scenes],
  selectedView: Sections.Posts,
  setSelectedViewIndex: jest.fn(),
  setup: jest.fn().mockResolvedValue({aborted: false}),
  update: jest.fn(),
  refresh: jest.fn(),
  loadMore: jest.fn(),
} as ProfileUiModel

export const mockedAutocompleteViewStore = {
  isLoading: false,
  isActive: true,
  prefix: '',
  follows: [
    {
      did: 'test did',
      declaration: {
        cid: '',
        actorType: 'app.bsky.system.actorUser',
      },
      handle: '',
      displayName: '',
      createdAt: '',
      indexedAt: '',
    },
  ],
  searchRes: [
    {
      did: 'test did',
      declaration: {
        cid: '',
        actorType: 'app.bsky.system.actorUser',
      },
      handle: '',
      displayName: '',
    },
  ],
  knownHandles: new Set<string>(),
  suggestions: [
    {
      handle: 'handle.test',
      displayName: 'Test Display',
    },
    {
      handle: 'handle2.test',
      displayName: 'Test Display 2',
    },
  ],
  rootStore: {} as RootStoreModel,
  setup: jest.fn(),
  setActive: jest.fn(),
  setPrefix: jest.fn(),
  // unknown required because of the missing private methods: _searchPromise, _getFollows , _search
} as unknown as UserAutocompleteViewModel

export const mockedLocalPhotosStore = {
  photos: {
    node: {
      type: '',
      group_name: '',
      image: {
        filename: '',
        extension: '',
        uri: '',
        height: 1000,
        width: 1000,
        fileSize: null,
        playableDuration: 0,
      },
      timestamp: 1672847197,
      location: null,
    },
  },
  rootStore: {} as RootStoreModel,
  setup: jest.fn(),
  // unknown required because of the missing private methods: _getPhotos
} as unknown as UserLocalPhotosModel

export const mockedSuggestedActorsStore = {
  isLoading: false,
  isRefreshing: false,
  hasLoaded: false,
  error: '',
  suggestions: [
    {
      did: '1',
      declaration: {
        cid: '',
        actorType: 'app.bsky.system.actorUser',
      },
      handle: 'handle1.test',
      displayName: 'test name 1',
      description: 'desc',
      indexedAt: '',
      _reactKey: '1',
    },
    {
      did: '2',
      declaration: {
        cid: '',
        actorType: 'app.bsky.system.actorUser',
      },
      handle: '',
      displayName: 'handle2.test',
      description: 'desc',
      indexedAt: '',
      _reactKey: '2',
    },
  ],
  rootStore: {} as RootStoreModel,
  hasContent: true,
  hasError: false,
  isEmpty: false,
  setup: jest.fn().mockResolvedValue(null),
  refresh: jest.fn(),
  // unknown required because of the missing private methods: _xLoading, _xIdle, _fetch, _appendAll, _append
} as unknown as SuggestedActorsViewModel

export const mockedUserFollowersStore = {
  isLoading: false,
  isRefreshing: false,
  hasLoaded: false,
  error: '',
  params: {
    user: 'test user',
  },
  subject: {
    did: 'test did',
    handle: '',
    declaration: {cid: '', actorType: ''},
  },
  followers: [
    {
      did: 'test did',
      declaration: {cid: '', actorType: ''},
      handle: 'testhandle',
      displayName: 'test name',
      indexedAt: '',
      _reactKey: '1',
    },
    {
      did: 'test did2',
      declaration: {cid: '', actorType: ''},
      handle: 'testhandle2',
      displayName: 'test name 2',
      indexedAt: '',
      _reactKey: '2',
    },
  ],
  rootStore: {} as RootStoreModel,
  hasContent: true,
  hasError: false,
  isEmpty: false,
  setup: jest.fn(),
  refresh: jest.fn(),
  loadMore: jest.fn(),
  // unknown required because of the missing private methods: _xIdle, _xLoading, _fetch, _replaceAll, _append
} as unknown as UserFollowersViewModel

export const mockedUserFollowsStore = {
  isLoading: false,
  isRefreshing: false,
  hasLoaded: false,
  error: '',
  params: {
    user: 'test user',
  },
  subject: {
    did: 'test did',
    handle: '',
    declaration: {cid: '', actorType: ''},
  },
  follows: [
    {
      did: 'test did',
      declaration: {cid: '', actorType: ''},
      handle: 'testhandle',
      displayName: 'test name',
      indexedAt: '',
      _reactKey: '1',
    },
    {
      did: 'test did2',
      declaration: {cid: '', actorType: ''},
      handle: 'testhandle2',
      displayName: 'test name 2',
      indexedAt: '',
      _reactKey: '2',
    },
  ],
  rootStore: {} as RootStoreModel,
  hasContent: true,
  hasError: false,
  isEmpty: false,
  setup: jest.fn(),
  refresh: jest.fn(),
  loadMore: jest.fn(),
  // unknown required because of the missing private methods: _xIdle, _xLoading, _fetch, _replaceAll, _append
} as unknown as UserFollowsViewModel

export const mockedRepostedByViewStore = {
  isLoading: false,
  isRefreshing: false,
  hasLoaded: false,
  error: '',
  resolvedUri: '',
  params: {
    uri: 'testuri',
  },
  uri: '',
  repostedBy: [
    {
      _reactKey: '',
      did: '',
      handle: '',
      displayName: '',
      declaration: {cid: '', actorType: ''},
      indexedAt: '',
    },
  ],
  hasContent: false,
  hasError: false,
  isEmpty: false,
  setup: jest.fn().mockResolvedValue({}),
  refresh: jest.fn().mockResolvedValue({}),
  loadMore: jest.fn().mockResolvedValue({}),
  // unknown required because of the missing private methods: _xIdle, _xLoading, _resolveUri, _fetch, _refresh, _replaceAll, _append
} as unknown as RepostedByViewModel

export const mockedVotesViewStore = {
  isLoading: false,
  isRefreshing: false,
  hasLoaded: false,
  error: '',
  resolvedUri: '',
  params: {
    uri: 'testuri',
  },
  uri: '',
  votes: [
    {
      _reactKey: '',
      direction: 'up',
      indexedAt: '',
      createdAt: '',
      actor: {
        did: '',
        handle: '',
        declaration: {cid: '', actorType: ''},
      },
    },
  ],
  hasContent: false,
  hasError: false,
  isEmpty: false,
  setup: jest.fn(),
  refresh: jest.fn().mockResolvedValue({}),
  loadMore: jest.fn().mockResolvedValue({}),
  // unknown required because of the missing private methods: _xIdle, _xLoading, _resolveUri, _fetch, _replaceAll, _append
} as unknown as VotesViewModel
