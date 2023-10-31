import {makeAutoObservable, runInAction} from 'mobx'
import {RootStoreModel} from '../root-store'
import {ChatAssistantMessage, ChatMessageRole} from 'w2-api/waverly_sdk'
import {WordDJModel} from './WordDJModel'

export interface Idea {
  key: string
  text: string
}

// Good inspiration: https://www.writerswrite.co.za/155-words-to-describe-an-authors-tone/
export const TONES = [
  'thoughtful',
  'Admiring',
  'Aggrieved',
  'Ambivalent',
  'Amused',
  'Animated',
  'Apologetic',
  'Appreciative',
  'Awestruck',
  'Candid',
  'Cautionary',
  'Chatty',
  'Comic',
  'Compassionate',
  'Concerned',
  'Conciliatory',
  'Confused',
  'Critical',
  'Curious',
  'Defiant',
  'Direct',
  'Earnest',
  'Empathetic',
  'Encouraging',
  'Enthusiastic',
  'Formal',
  'Frustrated',
  'Gentle',
  'Humble',
  'Humorous',
  'Impassioned',
  'Imploring',
  'Informative',
  'Inquisitive',
  'Inspirational',
  'Joyful',
  'Light-Hearted',
  'Loving',
  'Nostalgic',
  'Objective',
  'Optimistic',
  'Passionate',
  'Pensive',
  'Persuasive',
  'Philosophical',
  'Playful',
  'Resigned',
  'Restrained',
  'Reverent',
  'Satirical',
  'Sentimental',
  'Sincere',
  'Sceptical',
  'Solemn',
  'Sympathetic',
  'Thoughtful',
  'Uneasy',
  'Urgent',
  'Whimsical',
  'Witty',
  'Wonderous',
] as const

export const LENGTHS = ['short', 'medium', 'long'] as const
export const QUOTES = ['longer', 'another', 'random'] as const
const SENTENCE_TERMINATORS = /[.!?‽…]+\s*["”'’`›»)}\]\s*]/
const MIN_SPLIT_LENGTH = 5

export type Tone = (typeof TONES)[number]
export type Length = (typeof LENGTHS)[number]
export type Quote = (typeof QUOTES)[number]

export type State =
  | 'uninitialized'
  | 'analyzing'
  | 'idle'
  | 'generating'
  | 'canceled'

function simpleWordCount(text: string) {
  // Doesn't handle stand-alone-punctuation, e.g. space-separated-emdash
  return text.split(' ').filter(function (n) {
    return n !== '' // Filter multiple consecutive spaces.
  }).length
}

export class BlockManipulatorModel {
  // data
  tone?: Tone = undefined
  length?: Length = undefined
  quote?: Quote = undefined
  toneScrollPos: number = 0
  lengthScrollPos: number = 0
  quoteScrollPos: number = 0

  // state
  isAnalyzing = false
  isGenerating = false
  isCanceled = false
  isToneOpen = false
  isLengthOpen = false
  isQuoteOpen = false
  isShowingCustomTextBox = false

  constructor(
    public rootStore: RootStoreModel,
    public text: string,
    public model: WordDJModel,
  ) {
    makeAutoObservable(this, {rootStore: false}, {autoBind: true})
  }

  showCustomTextBox() {
    this.isShowingCustomTextBox = true
  }
  hideCustomTextBox() {
    this.isShowingCustomTextBox = false
  }

  setSavedToneScrollPos(val: number) {
    this.toneScrollPos = val
  }
  setSavedLengthScrollPos(val: number) {
    this.lengthScrollPos = val
  }
  setSavedQuoteScrollPos(val: number) {
    this.quoteScrollPos = val
  }

  get state(): State {
    if (this.isCanceled) return 'canceled'
    if (this.isAnalyzing) return 'analyzing'
    if (this.isGenerating) return 'generating'
    if (this.tone === undefined || this.length === undefined)
      return 'uninitialized'
    return 'idle'
  }

  get canSplit(): boolean {
    const [, part2] = this._splitParts()
    return !!part2
  }

  // actions
  // =

  split(): [string, string | undefined] {
    const result = this._splitParts()
    if (result[1]) this.text = result[1]
    return result
  }

  async analyzeText() {
    this._xAnalyzing()

    // TODO: Connect to API
    // Fake delay to simulate
    return new Promise<void>(resolve => {
      setTimeout(() => {
        runInAction(() => {
          this.tone = 'thoughtful'

          const numWords = simpleWordCount(this.text)
          if (numWords < 30) this.length = 'short'
          else if (numWords < 60) this.length = 'medium'
          else this.length = 'long'

          this.quote = 'random'
          this._xIdle()
        })
        resolve()
      }, 1000)
    })
  }

  rewrite() {
    this.isToneOpen = false
    this.isLengthOpen = false
    this.isQuoteOpen = false
    if (this.state !== 'idle') throw new Error('Rewriting when not idle')

    // Target number of words is a 90%/10% blend between the actual block's
    // wordcount and the 'target' wordcount of the block length.

    let blockLengthWordCount = 60 // Default to medium.
    if (this.length === 'short') blockLengthWordCount = 30
    else if (this.length === 'long') blockLengthWordCount = 120

    const actualWordCount = simpleWordCount(this.text)
    const avgNumWords = Math.ceil(
      0.9 * actualWordCount + 0.1 * blockLengthWordCount,
    )
    const systemMsg = this.model.getFullSystemMsg
    const rephraseSystemMsg = '  Given the idea "' + this.text + '"'
    const rephraseUserMsg =
      'Write ' +
      avgNumWords +
      ' words that states this idea in another way while retaining the original meaning and vibe of the idea.'
    this._issueChatGPTCall(systemMsg + rephraseSystemMsg, rephraseUserMsg, true)
  }

  setTone(tone: Tone) {
    this.isToneOpen = false
    if (tone === this.tone) return
    if (this.state !== 'idle') throw new Error('Setting tone when not idle')
    this.tone = tone

    // Target number of words is a 90%/10% blend between the actual block's
    // wordcount and the 'target' wordcount of the block length.

    let blockLengthWordCount = 60 // Default to medium.
    if (this.length === 'short') blockLengthWordCount = 30
    else if (this.length === 'long') blockLengthWordCount = 120

    const actualWordCount = simpleWordCount(this.text)
    const avgNumWords = Math.ceil(
      0.9 * actualWordCount + 0.1 * blockLengthWordCount,
    )

    const systemMsg = this.model.getArticlePayloadSystemMsg
    const userMsg =
      'Given the idea "' +
      this.text +
      '".  ' +
      'Write ' +
      avgNumWords +
      ' words that preserves the meaning of the idea, but that writes it in the tone of ' +
      tone +
      '.'
    this._issueChatGPTCall(systemMsg, userMsg, true)
  }

  async onCustomIdeaSubmitted(userPrompt: string) {
    this.isToneOpen = false
    this.isLengthOpen = false
    this.isQuoteOpen = false
    if (this.state !== 'idle')
      throw new Error('Submitting custom idea when not idle')

    // Target number of words is a 90%/10% blend between the actual block's
    // wordcount and the 'target' wordcount of the block length.

    // let blockLengthWordCount = 60 // Default to medium.
    // if (this.length === 'short') blockLengthWordCount = 30
    // else if (this.length === 'long') blockLengthWordCount = 120

    // const actualWordCount = simpleWordCount(this.text)
    // const avgNumWords = Math.ceil(
    //   0.9 * actualWordCount + 0.1 * blockLengthWordCount,
    // )
    const systemMsg =
      'You are helping a person write posts on the Waverly social media platform, which prioirities healthy social spaces and fostering wonder through shared interests.' +
      this.model.getFullSystemMsg
    const rephraseUserMsg =
      'Write a block of text to appear in the post that satisfies the following point of view of the post author:' +
      //+ '  Given the idea "' + this.text + '". '
      userPrompt +
      '. Do not use precisely the same language as what is in the quote.'
    // + 'Your response should be as close to ' +
    // avgNumWords +
    // ' words as possible.'
    this._issueChatGPTCall(systemMsg, rephraseUserMsg, true)
  }

  async _issueChatGPTCall(
    systemMessageContent: string,
    userMessageContent: string,
    bIncludeWaveTone: boolean,
    callback?: () => void,
    bDebug: boolean = true,
  ) {
    const systemMessage = {
      content: systemMessageContent,
      role: ChatMessageRole.System,
    }
    const userMessage = {
      content:
        userMessageContent +
        (bIncludeWaveTone && this.model.isGlamGroup === true
          ? ' Keep in mind, all your output has to sound like a Valley Girl is speaking.'
          : ''),
      role: ChatMessageRole.User,
    }

    const msgList: ChatAssistantMessage[] = [
      systemMessage,
      ...this.model.getMessageHistory,
      userMessage,
    ]

    // Record the user message payload, to be re-issued in subsequent calls.
    this.model.addToChatMessageHistory_User(userMessageContent)

    if (bDebug) {
      console.log('_issueChatGPTCall - systemMsg: ', msgList[0].content)
      for (let i = 1; i < msgList.length; ++i) {
        console.log('_issueChatGPTCall - userMsg', i, ': ', msgList[i].content)
      }
    }
    this._xGenerating()
    try {
      const response = await this.rootStore.waverlyAgent.api.promptGPT({
        messageList: msgList,
      })
      runInAction(() => {
        if (response.promptGPT) {
          // Record the response into the block.
          this.text = response.promptGPT

          // Record the response payload, to be re-issued in subsequent calls.
          this.model.addToChatMessageHistory_Assistant(response.promptGPT)

          // Fire a callback if one was provided.
          if (callback) callback()
        }
      })
    } catch (error) {
      this.rootStore.log.error(`WaverlyAgent.api.promptGPT`, error)
      runInAction(() => {
        this.text = '<Error generating text, see log>'
      })
    }
    this._xIdle()
  }

  setLength(length: Length) {
    this.isLengthOpen = false
    if (length === this.length) return
    if (this.state !== 'idle') throw new Error('Setting length when not idle')
    this.length = length
    let numWords
    switch (length) {
      case 'short':
        numWords = '30'
        break
      case 'medium':
        numWords = '60'
        break
      case 'long':
        numWords = '120'
        break
      default:
        numWords = '60'
    }
    const systemMsg = this.model.getFullSystemMsg
    const userMsg =
      'Given the idea "' +
      this.text +
      '". ' +
      'Write ' +
      numWords +
      ' words that states this idea in another way while retaining the original meaning, tone and vibe of the idea.'
    this._issueChatGPTCall(systemMsg, userMsg, true)
  }
  setQuote(quote: Quote) {
    this.isQuoteOpen = false
    //if (quote === this.quote) return
    if (this.state !== 'idle') throw new Error('Setting quote when not idle')
    this.quote = quote
    this._issueChatGPTCall(
      this.model.getArticlePayloadSystemMsg,
      'Get a new quote from this article of text that illustrates the idea well.',
      false,
      () => {
        this.text = '""' + this.text
      },
    )
  }

  openTone() {
    this.isToneOpen = true
    this.isLengthOpen = false
    this.isQuoteOpen = false
  }

  openLength() {
    this.isLengthOpen = true
    this.isToneOpen = false
    this.isQuoteOpen = false
  }

  openQuote() {
    this.isLengthOpen = false
    this.isToneOpen = false
    this.isQuoteOpen = true
  }

  cancel() {
    this.isAnalyzing = false
    this.isGenerating = false
    this.isCanceled = true
  }

  // state transitions
  // =

  _xAnalyzing() {
    if (this.state !== 'idle' && this.state !== 'uninitialized')
      throw new Error('Cannot analyze')
    this.isAnalyzing = true
  }

  _xIdle() {
    if (this.tone === undefined || this.length === undefined)
      throw new Error('Idle before analysis')
    this.isAnalyzing = false
    this.isGenerating = false
  }

  _xGenerating() {
    if (this.state !== 'idle') throw new Error('Cannot generate block')
    this.isGenerating = true
  }

  // utilities
  // =
  _splitParts(): [string, string | undefined] {
    const match = this.text.match(SENTENCE_TERMINATORS)
    if (!match?.index) return [this.text, undefined]
    const breakIndex = match.index + match[0].length
    const part1 = this.text.slice(0, breakIndex).trimEnd()
    const part2 = this.text.slice(breakIndex).trimStart()
    if (part2.length < MIN_SPLIT_LENGTH) return [this.text, undefined]
    return [part1, part2]
  }
}
