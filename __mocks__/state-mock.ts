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

export const mockedProfileStore = {
  isLoading: false,
  isRefreshing: false,
  hasLoaded: true,
  error: '',
  params: {
    actor: '',
  },
  did: '',
  handle: '',
  declaration: {
    cid: '',
    actorType: '',
  },
  creator: '',
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
  hasContent: jest.fn(),
  hasError: false,
  isEmpty: jest.fn(),
  isUser: jest.fn(),
  isScene: jest.fn(),
  setup: jest.fn().mockResolvedValue({aborted: false}),
  refresh: jest.fn(),
  toggleFollowing: jest.fn(),
  updateProfile: jest.fn(),
  // unknown required because of the missing private methods: _xLoading, _xIdle, _load, _replaceAll
} as unknown as ProfileViewModel

export const mockedMembersStore = {
  isLoading: false,
  isRefreshing: false,
  hasLoaded: false,
  error: '',
  params: {
    actor: '',
  },
  subject: {
    did: '',
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
      did: '',
      declaration: {
        cid: '',
        actorType: '',
      },
      handle: '',
      displayName: '',
      indexedAt: '',
    },
  ],
  rootStore: {} as RootStoreModel,
  hasContent: jest.fn(),
  hasError: false,
  isEmpty: jest.fn(),
  isMember: jest.fn(),
  setup: jest.fn().mockResolvedValue({aborted: false}),
  refresh: jest.fn(),
  loadMore: jest.fn(),
  removeMember: jest.fn(),
  // unknown required because of the missing private methods: _xLoading, _xIdle, _fetch, _replaceAll, _append
} as unknown as MembersViewModel

export const mockedMembershipsModel = {
  isLoading: false,
  isRefreshing: false,
  hasLoaded: false,
  error: '',
  params: {
    actor: '',
    limit: 1,
    before: '',
  },
  subject: {
    did: '',
    handle: '',
    displayName: '',
    declaration: {cid: '', actorType: ''},
    avatar: undefined,
  },
  memberships: [
    {
      did: '',
      declaration: {
        cid: '',
        actorType: 'app.bsky.system.actorUser',
      },
      handle: ',',
      displayName: '',
      createdAt: '',
      indexedAt: '',
      _reactKey: '',
    },
  ],
  rootStore: {} as RootStoreModel,
  hasContent: jest.fn(),
  hasError: false,
  isEmpty: jest.fn(),
  isMemberOf: jest.fn(),
  setup: jest.fn().mockResolvedValue({aborted: false}),
  refresh: jest.fn(),
  loadMore: jest.fn(),
  // unknown required because of the missing private methods: _xLoading, _xIdle, _fetch, _replaceAll, _append
} as unknown as MembershipsViewModel

export const mockedFeedModel = {
  isLoading: false,
  isRefreshing: false,
  hasNewLatest: false,
  hasLoaded: false,
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
  hasContent: jest.fn().mockReturnValue(true),
  hasError: true,
  isEmpty: jest.fn(),
  nonReplyFeed: [],
  setHasNewLatest: jest.fn(),
  setup: jest.fn().mockResolvedValue({aborted: false}),
  refresh: jest.fn(),
  loadMore: jest.fn(),
  loadLatest: jest.fn(),
  update: jest.fn(),
  checkForLatest: jest.fn().mockRejectedValue('Error checking for latest'),
  // unknown required because of the missing private methods: _xLoading, _xIdle, _pendingWork, _initialLoad, _loadLatest, _loadMore, _update, _replaceAll, _appendAll, _prependAll, _updateAll, _getFeed, loadMoreCursor, pollCursor, _loadPromise, _updatePromise, _loadLatestPromise, _loadMorePromise
} as unknown as FeedModel

export const mockedNotificationsModel = {
  isLoading: false,
  isRefreshing: false,
  hasLoaded: false,
  error: '',
  params: {
    limit: 1,
    before: '',
  },
  hasMore: true,
  notifications: [],
  rootStore: {} as RootStoreModel,
  hasContent: jest.fn(),
  hasError: false,
  isEmpty: jest.fn(),
  setup: jest.fn().mockResolvedValue({aborted: false}),
  refresh: jest.fn(),
  loadMore: jest.fn(),
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
    did: '',
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
  describeService: jest
    .fn()
    .mockResolvedValue({availableUserDomains: ['test']}),
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
  minimalShellMode: false,
  isMainMenuOpen: false,
  isModalActive: false,
  activeModal: undefined,
  isLightboxActive: false,
  activeLightbox: undefined,
  isComposerActive: false,
  composerOpts: undefined,
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
  did: '123',
  handle: 'test',
  displayName: 'test',
  description: 'test',
  avatar: '',
  notificationCount: 0,
  rootStore: {} as RootStoreModel,
  memberships: mockedMembershipsModel,
  mainFeed: mockedFeedModel,
  notifications: mockedNotificationsModel,
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
  getProfile: jest.fn(),
  overwrite: jest.fn(),
} as ProfilesViewModel

export const mockedLinkMetasStore = {
  hydrate: jest.fn(),
  serialize: jest.fn(),
  cache: new LRUMap(100),
  rootStore: {} as RootStoreModel,
  getLinkMeta: jest.fn(),
} as LinkMetasViewModel

export const mockedRootStore = {
  api: {} as SessionServiceClient,
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
} as RootStoreModel

export const mockedProfileUiStore = {
  profile: mockedProfileStore,
  feed: mockedFeedModel,
  memberships: mockedMembershipsModel,
  members: mockedMembersStore,
  selectedViewIndex: 0,
  rootStore: mockedRootStore,
  params: {
    user: 'test user',
  },
  currentView: mockedFeedModel,
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
