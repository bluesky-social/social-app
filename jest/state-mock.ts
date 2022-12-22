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
import {LRUMap} from 'lru_map'

const mockedSessionStore = {
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
  describeService: jest.fn(),
  login: jest.fn(),
  createAccount: jest.fn(),
  logout: jest.fn(),

  // unknown added because of the missing private methods: _connectPromise, configureApi & _connect
} as unknown as SessionModel

const mockedNavigationTabStore = {
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
  getBackList: jest.fn(),
  getForwardList: jest.fn(),
} as NavigationTabModel

const mockedNavigationStore = {
  serialize: jest.fn(),
  hydrate: jest.fn(),
  tabs: [],
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

const mockedShellStore = {
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

const mockedMeStore = {
  serialize: jest.fn(),
  hydrate: jest.fn(),
  did: '',
  handle: '',
  displayName: '',
  description: '',
  avatar: '',
  notificationCount: 0,
  rootStore: {} as RootStoreModel,
  // TODO: mock these models
  memberships: {
    placeholder: null,
  } as MembershipsViewModel,
  mainFeed: {
    placeholder: null,
  } as FeedModel,
  notifications: {
    placeholder: null,
  } as NotificationsViewModel,
  clear: jest.fn(),
  load: jest.fn(),
  clearNotificationCount: jest.fn(),
  fetchStateUpdate: jest.fn(),
  refreshMemberships: jest.fn(),
} as MeModel

const mockedOnboardStore = {
  serialize: jest.fn(),
  hydrate: jest.fn(),
  isOnboarding: false,
  stage: '',
  start: jest.fn(),
  stop: jest.fn(),
  next: jest.fn(),
} as OnboardModel

const mockedProfileStore = {
  hydrate: jest.fn(),
  serialize: jest.fn(),
  cache: new LRUMap(100),
  rootStore: {} as RootStoreModel,
  getProfile: jest.fn(),
  overwrite: jest.fn(),
} as ProfilesViewModel

const mockedLinkMetasStore = {
  hydrate: jest.fn(),
  serialize: jest.fn(),
  cache: new LRUMap(100),
  rootStore: {} as RootStoreModel,
  getLinkMeta: jest.fn(),
} as LinkMetasViewModel

export const mockedRootStore = {
  api: false,
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
  profiles: mockedProfileStore,
  linkMetas: mockedLinkMetasStore,
}
