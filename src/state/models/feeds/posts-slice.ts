import {makeAutoObservable} from 'mobx'
import {RootStoreModel} from '../root-store'
import {FeedViewPostsSlice} from 'lib/api/feed-manip'
import {PostsFeedItemModel} from './post'

export class PostsFeedSliceModel {
  // ui state
  _reactKey: string = ''

  // data
  items: PostsFeedItemModel[] = []

  constructor(public rootStore: RootStoreModel, slice: FeedViewPostsSlice) {
    this._reactKey = `slice-${slice.uri}`
    for (let i = 0; i < slice.items.length; i++) {
      this.items.push(
        new PostsFeedItemModel(
          rootStore,
          `${this._reactKey} - ${i}`,
          slice.items[i],
        ),
      )
    }
    makeAutoObservable(this, {rootStore: false})
  }

  get uri() {
    if (this.isReply) {
      return this.items[1].post.uri
    }
    return this.items[0].post.uri
  }

  get isThread() {
    return (
      this.items.length > 1 &&
      this.items.every(
        item => item.post.author.did === this.items[0].post.author.did,
      )
    )
  }

  get isReply() {
    return this.items.length > 1 && !this.isThread
  }

  get rootItem() {
    if (this.isReply) {
      return this.items[1]
    }
    return this.items[0]
  }

  get moderation() {
    // prefer the most stringent item
    const topItem = this.items.find(item => item.moderation.content.filter)
    if (topItem) {
      return topItem.moderation
    }
    // otherwise just use the first one
    return this.items[0].moderation
  }

  shouldFilter(ignoreFilterForDid: string | undefined): boolean {
    const mods = this.items
      .filter(item => item.post.author.did !== ignoreFilterForDid)
      .map(item => item.moderation)
    return !!mods.find(mod => mod.content.filter)
  }

  containsUri(uri: string) {
    return !!this.items.find(item => item.post.uri === uri)
  }

  isThreadParentAt(i: number) {
    if (this.items.length === 1) {
      return false
    }
    return i < this.items.length - 1
  }

  isThreadChildAt(i: number) {
    if (this.items.length === 1) {
      return false
    }
    return i > 0
  }
}
