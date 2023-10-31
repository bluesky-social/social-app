import {makeAutoObservable, runInAction} from 'mobx'
import {RootStoreModel} from '../root-store'
import {ChatAssistantMessage, ChatMessageRole} from 'w2-api/waverly_sdk'
import {WordDJModel} from './WordDJModel'
import {Length, Tone} from './BlockManipulatorModel'

// TODO: Remove once we fetch ideas from server
const quoteLabel = 'Find a supporting quote'
const ideaLabel = 'Get an idea from the article'
const MOCK_IDEAS = [
  ideaLabel,
  'Generate a metaphor',
  'Ask a question',
  quoteLabel,
  'Tell a joke',
]

interface Idea {
  key: string
  text: string
}

type Selection = number | 'custom'

type State =
  | 'uninitialized'
  | 'loading'
  | 'idle'
  | 'generating'
  | 'canceled'
  | 'generated'

export class IdeasModel {
  // data
  ideas: Idea[] = []

  // state
  isLoading = false
  isCanceled = false
  isGenerating = false
  isShowingCustomTextBox = false

  //////////////////////////////////////////////////////////////////////
  // options
  tone?: Tone = undefined
  length?: Length = undefined

  setTone(tone: Tone) {
    this.tone = tone
    this.isToneOpen = false
  }

  setLength(length: Length) {
    this.length = length
    this.isLengthOpen = false
  }

  isToneOpen = false
  isLengthOpen = false
  openTone() {
    this.isToneOpen = true
    this.isLengthOpen = false
  }

  openLength() {
    this.isLengthOpen = true
    this.isToneOpen = false
  }

  //////////////////////////////////////////////////////////////////////
  // ui
  customIdea?: string = undefined
  selection?: Selection = undefined

  // result of processing
  generatedIdea?: string = undefined

  constructor(public rootStore: RootStoreModel, public model: WordDJModel) {
    makeAutoObservable(this, {rootStore: false}, {autoBind: true})
  }

  get state(): State {
    if (this.isCanceled) return 'canceled'
    if (this.generatedIdea) return 'generated'
    if (this.isGenerating) return 'generating'
    if (this.isLoading) return 'loading'
    if (this.ideas.length === 0) return 'uninitialized'
    return 'idle'
  }

  // actions
  // =

  setCustomIdea(customIdea: string) {
    this.customIdea = customIdea
  }

  cancel() {
    this.selection = undefined
    this.customIdea = undefined
    this.isLoading = false
    this.isCanceled = true
    this.generatedIdea = undefined
  }

  showCustomTextBox() {
    this.isShowingCustomTextBox = true
  }

  showList() {
    this.isShowingCustomTextBox = false
  }

  // API
  // =

  async loadIdeas(_fullText: string) {
    this._xLoading()

    // TODO: Connect to API
    // Fake delay to simulate fetching ideas from the server
    return new Promise<void>(resolve => {
      setTimeout(() => {
        if (this.state !== 'loading') return
        runInAction(() => {
          if (this.ideas.length === 0) {
            for (const text of MOCK_IDEAS) {
              this.ideas.push({
                key: `idea-${text.replace(' ', '-')}`,
                text,
              })
            }
            this.tone = 'thoughtful'
            this.length = 'short'
          }
          this._xLoaded()
        })
        resolve()
      }, 1000)
    })
  }

  getNumWords() {
    let numWords
    switch (this.length) {
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
    return numWords
  }

  async generateIdea(
    selection: Selection,
    allBlocksText: string,
    nonQuotesBlocksText: string,
    bDebug: boolean = true,
  ) {
    this._xGenerating(selection)
    const ideaText = this.selectedIdeaText()
    if (!ideaText) throw new Error('Should have selection')

    const isQuote = ideaText === quoteLabel
    const isIdea = !isQuote && ideaText === ideaLabel

    // Article is typically the system message.
    const systemMessageContent =
      'You are helping a person write posts on the Waverly social media platform, which prioirities healthy social spaces and fostering wonder through shared interests. ' +
      (this.model.isGlamGroup === true
        ? 'All the text you produce has to be in the voice of Valley Girl speech.  All the text you produce has to give off the air of ditzy or unconcern. '
        : '') +
      this.model.getFullSystemMsg
    let userMessageContent = ''
    if (isQuote) {
      // Only included-non quotes when declaring the existing idea.
      if (nonQuotesBlocksText.length > 0)
        userMessageContent = 'Given the idea "' + nonQuotesBlocksText + '". '
      userMessageContent +=
        'Extract from the article another good quote that illustrates this idea well.  Do not explain why it illustrates the idea well, just produce the quote.  Do not produce anything that is already in the quote context.  Attempt to produce a ' +
        this.length +
        '-length quote that is no more than ' +
        this.getNumWords() +
        ' words.  If possible prefer quotes with a ' +
        this.tone +
        ' tone.'
    } else if (isIdea) {
      // We want a fresh idea, so include everything and say we want something different.
      //userMessageContent = 'Given the idea "' + allBlocksText + '". '
      userMessageContent =
        'Extract a different idea from the article. Write as close to ' +
        this.getNumWords() +
        ' words as possible, using a ' +
        this.tone +
        ' tone.  Choose an idea that connects logically to any provided quotes.  Do not include an explanation as to why the idea was chosen.'
      //If a quote was provided as context in the system message, produce a new idea that is supported by the quote.  Proudce only the idea, not a new quote.
    } else {
      userMessageContent = 'Given the idea "' + allBlocksText + '". '
      userMessageContent +=
        ideaText +
        '. Do not use precisely the same language as what is in the quote.  Do it based on the idea so far, in order to make the overall idea richer. Your response should be as close to ' +
        this.getNumWords() +
        ' words as possible.  Provide your response in a ' +
        this.tone +
        ' tone.'
    }

    const systemMessage = {
      content: systemMessageContent,
      role: ChatMessageRole.System,
    }
    const userMessage = {
      content:
        userMessageContent +
        (this.model.isGlamGroup === true
          ? ' Keep in mind, all your output has to sound like a Valley Girl is speaking.'
          : ''),
      role: ChatMessageRole.User,
    }
    const msgList: ChatAssistantMessage[] = [
      systemMessage,
      ...this.model.getMessageHistory,
      userMessage,
    ]

    if (bDebug) {
      console.log('_issueChatGPTCall - systemMsg: ', msgList[0].content)
      for (let i = 1; i < msgList.length; ++i) {
        console.log(
          '_issueChatGPTCall - ',
          msgList[i].role === ChatMessageRole.User ? 'user' : 'gpt',
          i,
          ': ',
          msgList[i].content,
        )
      }
    }
    // Record the user message payload, to be re-issued in subsequent calls.
    this.model.addToChatMessageHistory_User(userMessageContent)

    try {
      const response = await this.rootStore.waverlyAgent.api.promptGPT({
        messageList: msgList,
      })

      if (response.promptGPT) {
        if (isQuote) {
          // Remove surrounding quotation pairs from GPT-generated text.
          let tempStr = response.promptGPT
          tempStr = tempStr.replace(/^["“”](.+(?=["“”]$))["“”]$/, '$1')
          this._xGenerated('""' + `${tempStr}`)
        } else this._xGenerated(`${response.promptGPT}`)

        // Record the response payload, to be re-issued in subsequent calls.
        this.model.addToChatMessageHistory_Assistant(response.promptGPT)
      }
    } catch (error) {
      this.rootStore.log.error(`WaverlyAgent.api.promptGPT`, error)
      this._xGenerated('<Error generating text, see log>')
    }
  }

  // state transitions
  // =

  _xLoading() {
    if (this.state !== 'uninitialized') throw new Error('Cannot start loading')
    this.isLoading = true
  }

  _xLoaded() {
    if (this.state !== 'loading' || this.ideas.length === 0)
      throw new Error('Cannot set as loaded')
    this.isLoading = false
  }

  _xGenerating(selection: Selection) {
    if (this.state !== 'idle') throw new Error('Cannot generate idea')
    this.isGenerating = true
    this.selection = selection
  }

  _xGenerated(generatedIdea: string) {
    if (this.state !== 'generating') throw new Error('Generating impossible')
    this.isGenerating = false
    this.generatedIdea = generatedIdea
  }

  // helper function
  // =
  selectedIdeaText(): string | undefined {
    if (this.selection === undefined) return
    if (this.selection === 'custom') return this.customIdea
    return this.ideas[this.selection].text
  }
}
