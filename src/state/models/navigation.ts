import {makeAutoObservable} from 'mobx'
import {isObj, hasProp} from '../lib/type-guards'

interface HistoryItem {
  url: string
  title?: string
}

export class NavigationTabModel {
  history: HistoryItem[] = [{url: '/'}]
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

  // navigation
  // =

  navigate(url: string, title?: string) {
    if (this.index < this.history.length - 1) {
      this.history.length = this.index + 1
    }
    this.history.push({url, title})
    this.index = this.history.length - 1
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

  // utilities
  // =

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
    this.history = []
    this.index = 0
    if (isObj(v)) {
      if (hasProp(v, 'history') && Array.isArray(v.history)) {
        for (const item of v.history) {
          if (
            isObj(item) &&
            hasProp(item, 'url') &&
            typeof item.url === 'string'
          ) {
            let copy: HistoryItem = {url: item.url}
            if (hasProp(item, 'title') && typeof item.title === 'string') {
              copy.title = item.title
            }
            this.history.push(copy)
          }
        }
      }
      if (hasProp(v, 'index') && typeof v.index === 'number') {
        this.index = v.index
      }
      if (this.index >= this.history.length - 1) {
        this.index = this.history.length - 1
      }
    }
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

  // accessors
  // =

  get tab() {
    return this.tabs[this.tabIndex]
  }

  // navigation
  // =

  navigate(url: string, title?: string) {
    this.tab.navigate(url, title)
  }

  // tab management
  // =

  newTab(url: string, title?: string) {
    const tab = new NavigationTabModel()
    tab.navigate(url, title)
    this.tabs.push(tab)
    this.tabIndex = this.tabs.length - 1
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
    this.tabs.length = 0
    this.tabIndex = 0
    if (isObj(v)) {
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
    }
  }
}
