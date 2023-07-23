import {FeedViewPostsSlice} from 'lib/api/feed-manip'
import {PostsFeedItemModel} from './post'
import {RootStoreModel} from '../root-store'
import {makeAutoObservable} from 'mobx'
import {mergePostModerations} from 'lib/labeling/helpers'

let _idCounter = 0

export class PostsFeedSliceModel {
  // ui state
  _reactKey: string = ''

  // data
  items: PostsFeedItemModel[] = []

  constructor(
    public rootStore: RootStoreModel,
    reactKey: string,
    slice: FeedViewPostsSlice,
  ) {
    this._reactKey = reactKey
    for (const item of slice.items) {
      const reactions = this.rootStore.reactions.reactionMap[item.post.uri] ? Object.values(this.rootStore.reactions.reactionMap[item.post.uri]) : [];
      this.items.push(
        new PostsFeedItemModel(rootStore, `slice-${_idCounter++}`, item, reactions.length ? reactions : undefined),
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
    return mergePostModerations(this.items.map(item => item.moderation))
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
