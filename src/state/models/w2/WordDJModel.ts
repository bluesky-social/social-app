import React from 'react'
import {makeAutoObservable} from 'mobx'
import {RootStoreModel} from '../root-store'
import {post} from 'lib/waverly-api'
import {ChatMessageRole, GroupSearchItem} from 'w2-api/waverly_sdk'
import {IsQuote} from 'view/com/w2/util/Quote'
import {ExternalEmbedDraft} from 'lib/api'

let nextIdx = 0

type PlaceholderState = 'normal' | 'loading'
export type BlockState = 'normal' | 'selected' | 'moving'

export interface InsertionPoint {
  type: 'before' | 'after'
  key: React.Key
}

interface BlockInfoStandard {
  type: 'standard'
  key: React.Key
  text: string
  state: BlockState
}

interface BlockInfoPlaceholder {
  type: 'placeholder'
  key: 'placeholder'
  state: PlaceholderState
}

type BlockInfo = BlockInfoStandard | BlockInfoPlaceholder

export type WordDJMode = 'word-dj' | 'manual'
type State = 'idle' | 'saving'

export class WordDJModel {
  // data for GPT prompting
  articlePayload: string = ''
  quotePayload: string = ''
  ideaPayload: string = ''
  messageHistory: {
    content: string
    role: ChatMessageRole
  }[] = []

  // data for the WIP post
  extEmbed: ExternalEmbedDraft | undefined = undefined
  blocks: BlockInfo[] = [] // Authoritative state while in 'word-dj' mode.
  manualPayload: string = '' // Authoritative state while in Used in 'manual' mode.

  // mode
  currentMode: WordDJMode = 'word-dj' // Indicates which mode we're currently in.

  // state
  isSaving = false

  constructor(
    public rootStore: RootStoreModel,
    public group: GroupSearchItem | undefined,
  ) {
    makeAutoObservable(
      this,
      {
        rootStore: false,
      },
      {autoBind: true},
    )
  }

  clear() {
    this.articlePayload = ''
    this.quotePayload = ''
    this.ideaPayload = ''
    this.messageHistory = []
    this.extEmbed = undefined
    this.blocks = []
    this.manualPayload = ''
    this.currentMode = 'word-dj'
    // TODO this.isSaving
    this.group = undefined
  }

  allBlocksText() {
    return this.blocks
      .map(block => {
        return block.type === 'standard' ? block.text : ''
      })
      .filter(blockText => {
        return blockText !== ''
      })
      .join(' ')
  }

  nonQuotesBlocksText() {
    let result = ''
    for (let i = 0; i < this.blocks.length; ++i) {
      if (this.blocks[i].type === 'standard') {
        if (!(this.blocks[i] as BlockInfoStandard).text.startsWith('""')) {
          result += (this.blocks[i] as BlockInfoStandard).text + ' '
        }
      }
    }
    return result
  }

  //////////////////////////////////////////////////////////////////////////////
  // Articles and quotes selected by the user upon entering WordDJ.

  setArticlePayload(newPayload: string) {
    this.articlePayload = newPayload
  }
  get getArticlePayloadSystemMsg() {
    return 'The article for context is: "' + this.articlePayload + '".'
  }

  setQuotePayload(newPayload: string) {
    this.quotePayload = newPayload
  }
  get getQuotePayloadSystemMsg() {
    return this.quotePayload?.length > 0
      ? '\n\nThe quote for context is: "' + this.quotePayload + '".'
      : null
  }

  setIdeaPayload(newPayload: string) {
    this.ideaPayload = newPayload
  }
  get getIdeaPayloadSystemMsg() {
    return this.ideaPayload?.length > 0
      ? '\n\nThe idea the user is trying to articulate via a social media post is: "' +
          this.ideaPayload +
          '".'
      : null
  }

  setExtEmbed(embed: ExternalEmbedDraft) {
    this.extEmbed = embed
  }

  get getFullSystemMsg() {
    let result = this.getArticlePayloadSystemMsg
    if (this.quotePayload?.length > 0) result += this.getQuotePayloadSystemMsg
    if (this.ideaPayload?.length > 0) result += this.getIdeaPayloadSystemMsg
    return result
  }

  //////////////////////////////////////////////////////////////////////////////
  // LLM message history.

  addToChatMessageHistory_User(userMsg: string) {
    this.messageHistory.push({content: userMsg, role: ChatMessageRole.User})
  }
  addToChatMessageHistory_Assistant(assistantMsg: string) {
    this.messageHistory.push({
      content: assistantMsg,
      role: ChatMessageRole.Assistant,
    })
  }
  get getMessageHistory() {
    return this.messageHistory
  }

  //////////////////////////////////////////////////////////////////////////////
  // Mode.  The setMode functions return true if the mode changed.

  updateAuthoritativeStateForMode() {
    if (this.currentMode === 'word-dj') this._computeBlocksFromManualPayload()
    else if (this.currentMode === 'manual')
      this._computeManualPayloadFromBlocks()
  }

  setManualPayload(newPayload: string) {
    this.manualPayload = newPayload
  }

  setMode(newMode: WordDJMode) {
    const prevMode = this.currentMode
    this.currentMode = newMode
    return prevMode !== newMode // Return true if the mode changed.
  }

  private _computeManualPayloadFromBlocks() {
    this.manualPayload = this.blocks
      .map(b =>
        b.type === 'standard' ? (b as BlockInfoStandard).text : undefined,
      )
      .filter(t => t !== undefined)
      .join('\n\n')
    return this.manualPayload
  }

  private _computeBlocksFromManualPayload() {
    this.blocks = []
    this.manualPayload
      .split('\n')
      .forEach(text => (text.length > 0 ? this.createBlock(text) : undefined))
  }

  updateSystemMessageFromBlocks() {
    if (this.currentMode === 'word-dj') {
      // Iterate over all the blocks in the WIP post.
      // If we encounter any quote blocks, append their text to the system message.
      // All other blocks can be amalgamated into "The Text so far" Block
      const allQuotes = this.blocks
        .map(b =>
          b.type === 'standard'
            ? IsQuote((b as BlockInfoStandard).text).asQuote
            : undefined,
        )
        .filter(t => t !== undefined)
        .join(' ')

      this.setQuotePayload(allQuotes)
    }
  }
  //////////////////////////////////////////////////////////////////////////////
  // State
  get state(): State {
    if (this.isSaving) return 'saving'
    return 'idle'
  }

  get hasSelection() {
    return this.blocks.some(
      b => b.type === 'standard' && b.state === 'selected',
    )
  }

  get selectedBlock(): BlockInfoStandard | undefined {
    return this.blocks.find(
      b => b.type === 'standard' && b.state === 'selected',
    ) as BlockInfoStandard | undefined
  }

  isBlockSelected(key: React.Key) {
    for (let i = 0; i < this.blocks.length; i++) {
      if (this.blocks[i].key === key) {
        if (this.blocks[i].state === 'selected') {
          return true
        }
      }
    }
    return false
  }

  // ui actions
  // =

  selectBlock(key: React.Key) {
    this.blocks.forEach(b => {
      if (b.type !== 'standard') return
      if (b.key === key) b.state = 'selected'
      else if (b.state === 'selected') b.state = 'normal'
    })
  }

  unselectBlock(key: React.Key) {
    this.blocks.forEach(b => {
      if (b.type !== 'standard') return
      if (b.key === key) b.state = 'normal'
    })
  }

  setGroup(group: GroupSearchItem) {
    this.group = group
  }

  unselectAll() {
    this.blocks.forEach(b => {
      if (b.type !== 'standard') return
      if (b.state === 'selected') b.state = 'normal'
    })
  }

  setIsMoving(key: React.Key, moving: boolean) {
    const state = moving ? 'moving' : 'normal'
    this.blocks.forEach(b => {
      if (b.type !== 'standard') return
      if (b.key === key) b.state = state
    })
  }

  moveBlock(key: React.Key, insertionPoint?: InsertionPoint) {
    if (!insertionPoint) {
      this.setIsMoving(key, false)
      return
    }
    let removed: BlockInfo | undefined
    this.blocks = this.blocks.filter(b => {
      const remove = b.key === key
      if (remove) removed = b
      return !remove
    })
    if (!removed || removed.type !== 'standard')
      throw new Error('Invalid moveBlock')
    removed.state = 'normal'
    this._insertBlock(removed, insertionPoint)
  }

  // Returns key of the newly-created block.
  createBlock(text: string, insertionPoint?: InsertionPoint): React.Key {
    const block: BlockInfo = {
      type: 'standard',
      key: `b${nextIdx++}`,
      text,
      state: 'normal',
    }
    this._insertBlock(block, insertionPoint)
    return block.key
  }

  removeBlock(key: React.Key) {
    this.blocks = this.blocks.filter(b => b.key !== key)
  }

  undo() {
    // TODO
  }

  redo() {
    // TODO
  }

  hidePlaceholder() {
    this.blocks = this.blocks.filter(b => b.type !== 'placeholder')
  }

  setPlaceholderLoading() {
    for (const b of this.blocks) {
      if (b.type === 'placeholder') b.state = 'loading'
    }
  }

  showPlaceholder(insertionPoint?: InsertionPoint) {
    this.hidePlaceholder()
    this._insertBlock(
      {type: 'placeholder', key: 'placeholder', state: 'normal'},
      insertionPoint,
    )
  }

  getBlockText(key: React.Key): string | undefined {
    const block = this.blocks.find(b => b.key === key)
    if (block?.type !== 'standard') return
    return block.text
  }

  setBlockText(key: React.Key, text: string) {
    const block = this.blocks.find(b => b.key === key)
    if (block?.type !== 'standard') return
    block.text = text
  }

  get fullText() {
    return this.blocks
      .map(b => (b.type === 'standard' ? b.text : undefined))
      .filter(t => t !== undefined)
      .join('\n\n')
  }

  get isGlamGroup() {
    return this.group && this.group.handle === 'aiglamsquad.group'
  }
  // API
  // =

  get canSavePost() {
    // No target group
    if (!this.group || !this.group.did || !this.group.handle) return false
    if (!this.group.did.length || !this.group.handle.length) return false
    // Manual mode
    if (this.currentMode === 'manual') return this.manualPayload.length > 0
    // Block mode
    if (this.blocks.length === 0) return false
    return true
  }
  async savePost() {
    if (!this.group) {
      throw 'No group was assigned'
    }

    if (!this.extEmbed) {
      this.rootStore.log.warn(
        'Waverly MiniBlog posting without external embed.',
      )
    }

    this._xSaving()

    // The impl here operates on blocks - make sure the blocks state is updated
    // if we were in manual-editing mode.
    if (this.currentMode === 'manual') this._computeBlocksFromManualPayload()
    const fullText = this.fullText

    return await post(this.rootStore, {
      groupDid: this.group.did,
      rawText: fullText,
      extLink: this.extEmbed,
    })
  }

  // state transitions
  // =

  _xSaving() {
    this.isSaving = true
  }

  _xIdle() {
    this.isSaving = false
  }

  // helper functions
  // =

  _insertBlock(block: BlockInfo, insertionPoint?: InsertionPoint) {
    if (!insertionPoint) {
      this.blocks.push(block)
      return
    }
    const index = this.blocks.findIndex(b => b.key === insertionPoint.key)
    if (index < 0) throw new Error('Invalid block insertion')
    const insertIdx = index + (insertionPoint.type === 'after' ? 1 : 0)
    this.blocks.splice(insertIdx, 0, block)
  }
}
