import {RootStoreModel} from './root-store'
import {makeAutoObservable} from 'mobx'
import {TABS_ENABLED} from 'lib/build-flags'
import {segmentClient} from 'lib/analytics'

let __id = 0
function genId() {
  return String(++__id)
}

// NOTE
// this model was originally built for a freeform "tabs" concept like a browser
// we've since decided to pause that idea and do something more traditional
// until we're fully sure what that is, the tabs are being repurposed into a fixed topology
// - Tab 0: The "Default" tab
// - Tab 1: The "Search" tab
// - Tab 2: The "Notifications" tab
// These tabs always retain the first item in their history.
// -prf
export enum TabPurpose {
  Default = 0,
  Search = 1,
  Notifs = 2,
}

export const TabPurposeMainPath: Record<TabPurpose, string> = {
  [TabPurpose.Default]: '/',
  [TabPurpose.Search]: '/search',
  [TabPurpose.Notifs]: '/notifications',
}

interface HistoryItem {
  url: string
  ts: number
  title?: string
  id: string
}

export type HistoryPtr = string // `{tabId}-{historyId}`

export class NavigationTabModel {
  id = genId()
  history: HistoryItem[]
  index = 0
  isNewTab = false

  constructor(public fixedTabPurpose: TabPurpose) {
    this.history = [
      {url: TabPurposeMainPath[fixedTabPurpose], ts: Date.now(), id: genId()},
    ]
    makeAutoObservable(this, {
      serialize: false,
      hydrate: false,
    })
  }

  // accessors
  // =

  get current() {
    return this.history[this.index]
  }

  get canGoBack() {
    return this.index > 0
  }

  get canGoForward() {
    return this.index < this.history.length - 1
  }

  getBackList(n: number) {
    const start = Math.max(this.index - n, 0)
    const end = this.index
    return this.history.slice(start, end).map((item, i) => ({
      url: item.url,
      title: item.title,
      index: start + i,
      id: item.id,
    }))
  }

  get backTen() {
    return this.getBackList(10)
  }

  getForwardList(n: number) {
    const start = Math.min(this.index + 1, this.history.length)
    const end = Math.min(this.index + n + 1, this.history.length)
    return this.history.slice(start, end).map((item, i) => ({
      url: item.url,
      title: item.title,
      index: start + i,
      id: item.id,
    }))
  }

  get forwardTen() {
    return this.getForwardList(10)
  }

  // navigation
  // =

  navigate(url: string, title?: string) {
    try {
      const path = url.split('/')[1]
      segmentClient.track('Navigation', {
        path,
      })
    } catch (error) {}

    if (this.current?.url === url) {
      this.refresh()
    } else {
      if (this.index < this.history.length - 1) {
        this.history.length = this.index + 1
      }
      // TEMP ensure the tab has its purpose's main view -prf
      if (this.history.length < 1) {
        const fixedUrl = TabPurposeMainPath[this.fixedTabPurpose]
        this.history.push({url: fixedUrl, ts: Date.now(), id: genId()})
      }
      this.history.push({url, title, ts: Date.now(), id: genId()})
      this.index = this.history.length - 1
    }
  }

  refresh() {
    this.history = [
      ...this.history.slice(0, this.index),
      {
        url: this.current.url,
        title: this.current.title,
        ts: Date.now(),
        id: this.current.id,
      },
      ...this.history.slice(this.index + 1),
    ]
  }

  goBack() {
    if (this.canGoBack) {
      this.index--
    }
  }

  // TEMP
  // a helper to bring the tab back to its base state
  // -prf
  fixedTabReset() {
    this.index = 0
  }

  goForward() {
    if (this.canGoForward) {
      this.index++
    }
  }

  goToIndex(index: number) {
    if (index >= 0 && index <= this.history.length - 1) {
      this.index = index
    }
  }

  setTitle(id: string, title: string) {
    this.history = this.history.map(h => {
      if (h.id === id) {
        return {...h, title}
      }
      return h
    })
  }

  setIsNewTab(v: boolean) {
    this.isNewTab = v
  }

  // persistence
  // =

  serialize(): unknown {
    return {
      history: this.history,
      index: this.index,
    }
  }

  hydrate(_v: unknown) {
    // TODO fixme
    // if (isObj(v)) {
    //   if (hasProp(v, 'history') && Array.isArray(v.history)) {
    //     for (const item of v.history) {
    //       if (
    //         isObj(item) &&
    //         hasProp(item, 'url') &&
    //         typeof item.url === 'string'
    //       ) {
    //         let copy: HistoryItem = {
    //           url: item.url,
    //           ts:
    //             hasProp(item, 'ts') && typeof item.ts === 'number'
    //               ? item.ts
    //               : Date.now(),
    //         }
    //         if (hasProp(item, 'title') && typeof item.title === 'string') {
    //           copy.title = item.title
    //         }
    //         this.history.push(copy)
    //       }
    //     }
    //   }
    //   if (hasProp(v, 'index') && typeof v.index === 'number') {
    //     this.index = v.index
    //   }
    //   if (this.index >= this.history.length - 1) {
    //     this.index = this.history.length - 1
    //   }
    // }
  }
}

export class NavigationModel {
  tabs: NavigationTabModel[] = [
    new NavigationTabModel(TabPurpose.Default),
    new NavigationTabModel(TabPurpose.Search),
    new NavigationTabModel(TabPurpose.Notifs),
  ]
  tabIndex = 0

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(this, {
      rootStore: false,
      serialize: false,
      hydrate: false,
    })
  }

  clear() {
    this.tabs = [
      new NavigationTabModel(TabPurpose.Default),
      new NavigationTabModel(TabPurpose.Search),
      new NavigationTabModel(TabPurpose.Notifs),
    ]
    this.tabIndex = 0
  }

  // accessors
  // =

  get tab() {
    return this.tabs[this.tabIndex]
  }

  get tabCount() {
    return this.tabs.length
  }

  isCurrentScreen(tabId: string, index: number) {
    return this.tab.id === tabId && this.tab.index === index
  }

  // navigation
  // =

  navigate(url: string, title?: string) {
    this.rootStore.emitNavigation()
    this.tab.navigate(url, title)
  }

  refresh() {
    this.tab.refresh()
  }

  setTitle(ptr: HistoryPtr, title: string) {
    const [tid, hid] = ptr.split('-')
    this.tabs.find(t => t.id === tid)?.setTitle(hid, title)
  }

  handleLink(url: string) {
    let path
    if (url.startsWith('/')) {
      path = url
    } else if (url.startsWith('http')) {
      try {
        path = new URL(url).pathname
      } catch (e) {
        console.error('Invalid url', url, e)
        return
      }
    } else {
      console.error('Invalid url', url)
      return
    }
    this.navigate(path)
  }

  // tab management
  // =

  // TEMP
  // fixed tab helper function
  // -prf
  switchTo(purpose: TabPurpose, reset: boolean) {
    this.rootStore.emitNavigation()
    switch (purpose) {
      case TabPurpose.Notifs:
        this.tabIndex = 2
        break
      case TabPurpose.Search:
        this.tabIndex = 1
        break
      default:
        this.tabIndex = 0
    }
    if (reset) {
      this.tab.fixedTabReset()
    }
  }

  newTab(url: string, title?: string) {
    if (!TABS_ENABLED) {
      return this.navigate(url)
    }
    const tab = new NavigationTabModel(TabPurpose.Default)
    tab.navigate(url, title)
    tab.isNewTab = true
    this.tabs.push(tab)
    this.tabIndex = this.tabs.length - 1
  }

  setActiveTab(tabIndex: number) {
    if (!TABS_ENABLED) {
      return
    }
    this.tabIndex = Math.max(Math.min(tabIndex, this.tabs.length - 1), 0)
  }

  closeTab(tabIndex: number) {
    if (!TABS_ENABLED) {
      return
    }
    this.tabs = [
      ...this.tabs.slice(0, tabIndex),
      ...this.tabs.slice(tabIndex + 1),
    ]
    if (this.tabs.length === 0) {
      this.newTab('/')
    } else if (this.tabIndex >= this.tabs.length) {
      this.tabIndex = this.tabs.length - 1
    }
  }

  // persistence
  // =

  serialize(): unknown {
    return {
      tabs: this.tabs.map(t => t.serialize()),
      tabIndex: this.tabIndex,
    }
  }

  hydrate(_v: unknown) {
    // TODO fixme
    this.clear()
    /*if (isObj(v)) {
      if (hasProp(v, 'tabs') && Array.isArray(v.tabs)) {
        for (const tab of v.tabs) {
          const copy = new NavigationTabModel()
          copy.hydrate(tab)
          if (copy.history.length) {
            this.tabs.push(copy)
          }
        }
      }
      if (hasProp(v, 'tabIndex') && typeof v.tabIndex === 'number') {
        this.tabIndex = v.tabIndex
      }
    }*/
  }
}
