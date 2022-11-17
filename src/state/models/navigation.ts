import {makeAutoObservable} from 'mobx'
import {isObj, hasProp} from '../lib/type-guards'

let __tabId = 0
function genTabId() {
  return ++__tabId
}

interface HistoryItem {
  url: string
  ts: number
  title?: string
}

export class NavigationTabModel {
  id = genTabId()
  history: HistoryItem[] = [{url: '/', ts: Date.now()}]
  index = 0

  constructor() {
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
    }))
  }

  get backTen() {
    return this.getBackList(10)
  }

  getForwardList(n: number) {
    const start = Math.min(this.index + 1, this.history.length)
    const end = Math.min(this.index + n, this.history.length)
    return this.history.slice(start, end).map((item, i) => ({
      url: item.url,
      title: item.title,
      index: start + i,
    }))
  }

  get forwardTen() {
    return this.getForwardList(10)
  }

  // navigation
  // =

  navigate(url: string, title?: string) {
    if (this.current?.url === url) {
      this.refresh()
    } else {
      if (this.index < this.history.length - 1) {
        this.history.length = this.index + 1
      }
      this.history.push({url, title, ts: Date.now()})
      this.index = this.history.length - 1
    }
  }

  refresh() {
    this.history = [
      ...this.history.slice(0, this.index),
      {url: this.current.url, title: this.current.title, ts: Date.now()},
      ...this.history.slice(this.index + 1),
    ]
  }

  goBack() {
    if (this.canGoBack) {
      this.index--
    }
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

  setTitle(title: string) {
    this.current.title = title
  }

  // persistence
  // =

  serialize(): unknown {
    return {
      history: this.history,
      index: this.index,
    }
  }

  hydrate(v: unknown) {
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
  tabs: NavigationTabModel[] = [new NavigationTabModel()]
  tabIndex = 0

  constructor() {
    makeAutoObservable(this, {
      serialize: false,
      hydrate: false,
    })
  }

  clear() {
    this.tabs = [new NavigationTabModel()]
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

  isCurrentScreen(tabId: number, index: number) {
    return this.tab.id === tabId && this.tab.index === index
  }

  // navigation
  // =

  navigate(url: string, title?: string) {
    this.tab.navigate(url, title)
  }

  refresh() {
    this.tab.refresh()
  }

  setTitle(title: string) {
    this.tab.setTitle(title)
  }

  // tab management
  // =

  newTab(url: string, title?: string) {
    const tab = new NavigationTabModel()
    tab.navigate(url, title)
    this.tabs.push(tab)
    this.tabIndex = this.tabs.length - 1
  }

  setActiveTab(tabIndex: number) {
    this.tabIndex = Math.max(Math.min(tabIndex, this.tabs.length - 1), 0)
  }

  closeTab(tabIndex: number) {
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

  hydrate(v: unknown) {
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
