import {RootStoreModel} from 'state/index'
import {makeAutoObservable} from 'mobx'
import {ChatAssistantMessage, ChatMessageRole} from 'w2-api/waverly_sdk'
import {EmbedInfo} from 'lib/hooks/waverly/useEmbedInfo'
import {PostsFeedItemModel} from 'state/models/feeds/post'
import {ProfileViewBasic} from '@waverlyai/atproto-api/dist/client/types/app/bsky/actor/defs'
import {extractReadableDocFromUrl} from 'view/com/w2/reader/ExtractReadableDoc'

const SYSTEM_MSG =
  "You are WaverlyChat, a digital assistant for a social media platform called Waverly.  On Waverly, a Wave is what we call a user group - a community of users united around a similar topic, vibe, or tone.   A waverly User can follow a Wave. Posts are made from users to individual Waves. Waverly assembles a user's feed by bringing together posts from waves that user follows, interleaving them into the feed shown to the user.  Waverly uses Given a user's request to waverlyChat, your goal is to determine what the steps would be for WaverlyChat to satisfy the request.  The user will be making the request in the context of a Wave, called $contextWaveID, a post called $contextPostID, the requesting user themselves, called $requestingUserID, or their feed $userFeed.  If there is ambiguity in the user's request, ask the user follow-up questions to get the required information. If the user is asking a general information question, you can reply with the answer you know. Once you have gathered all the required information, list the steps to take to satisfy this request.  These steps are intended to represent the function calls to achieve the request.  This list of steps is not to be directed at the user."
interface ChatBlob_Embed {
  type: 'Embed'
  embedInfo: EmbedInfo
  isAI: boolean
}

interface ChatBlob_UGCPost {
  type: 'UGCPost'
  groupPost: PostsFeedItemModel
  isAI: boolean
}

interface ChatBlob_Break {
  type: 'Break'
}

interface ChatBlob_ChatStatement {
  type: 'ChatStatement'
  text: string
  isAI: boolean
}

interface ChatBlob_UserProfile {
  type: 'UserProfile'
  profile: ProfileViewBasic
  isAI: boolean
}

type ChatBlob =
  | ChatBlob_Embed
  | ChatBlob_UGCPost
  | ChatBlob_Break
  | ChatBlob_ChatStatement
  | ChatBlob_UserProfile

export class WaverlyChatModel {
  contextEmbedInfo: EmbedInfo | undefined = undefined
  contextDocument: Document | undefined = undefined
  conversation: ChatBlob[] = []
  messageHistory: {
    content: string
    role: ChatMessageRole
  }[] = []
  generatingChat: boolean = false
  generatingSmartOptions: boolean = false
  onHasNewContent: () => void = () => {}
  onHasNewSmartOptions: (newOptions: string[]) => void = () => {}

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(this, {rootStore: false}, {autoBind: true})
  }

  setIsGeneratingChat(v: boolean) {
    this.generatingChat = v
  }
  get isGeneratingChat() {
    return this.generatingChat
  }
  setIsGeneratingSmartOptions(v: boolean) {
    this.generatingSmartOptions = v
  }
  get isGeneratingSmartOptions() {
    return this.generatingSmartOptions
  }

  setOnHasNewContent(v: () => void) {
    this.onHasNewContent = v
  }
  setOnHasNewSmartOptions(v: (smartOptions: string[]) => void) {
    this.onHasNewSmartOptions = v
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

  /*
  async fakeGPTResponse(scrollViewRef: ScrollView | null) {
    // TODO: Connect to API
    // Fake delay to simulate fetching ideas from the server
    return new Promise<void>(resolve => {
      setTimeout(() => {
        runInAction(() => {
          this.addToConversation(
            "I understand you're merely human, but really I would have hoped for something far juicier.  Something with some, you know, organic creativity?",
            true,
          )
          scrollViewRef?.scrollToEnd({animated: true})
        })
        resolve()
      }, Math.random() * 2000 + 2000)
    })
  }
  */

  advanceSession() {
    // TODO: store a session ID with blobs?
    const newBlob: ChatBlob = {type: 'Break'}
    this.conversation.push(newBlob)
    console.log('=========== Inserting break ============')
    this.contextEmbedInfo = undefined
    this.contextDocument = undefined
    this.messageHistory = []
  }
  setSessionContext(embedInfo: EmbedInfo) {
    this.contextEmbedInfo = embedInfo
    this.contextDocument = undefined

    if (this.contextEmbedInfo) {
      const embed = this.contextEmbedInfo
      if (embed.link) {
        console.log('loading external', embed.link.originalUri)
        extractReadableDocFromUrl(embed.link.originalUri).then(document => {
          console.log('loaded? ', document ? 'true' : 'false')
          if (document) this.contextDocument = document
        })
      } else console.log('no external to load')
    }
  }
  addToConversation_groupPost(groupPost: PostsFeedItemModel) {
    const newBlob: ChatBlob = {
      type: 'UGCPost',
      groupPost,
      isAI: true,
    }
    this.conversation.push(newBlob)
  }
  addToConversation_Embed(embedInfo: EmbedInfo) {
    const newBlob: ChatBlob = {
      type: 'Embed',
      embedInfo,
      isAI: true,
    }
    this.conversation.push(newBlob)
  }
  addToConversation_UserProfile(profile: ProfileViewBasic) {
    const newBlob: ChatBlob = {
      type: 'UserProfile',
      profile,
      isAI: true,
    }
    this.conversation.push(newBlob)
  }
  addToConversation(text: string, isAI: boolean) {
    if (text.length > 0) {
      const newBlob: ChatBlob = {
        type: 'ChatStatement',
        text,
        isAI,
      }
      this.conversation.push(newBlob)
    }
  }
  isAIBlob(index: number) {
    if (this.conversation[index].type === 'ChatStatement')
      return (this.conversation[index] as ChatBlob_ChatStatement).isAI
    if (this.conversation[index].type === 'UGCPost')
      return (this.conversation[index] as ChatBlob_UGCPost).isAI
    if (this.conversation[index].type === 'Embed')
      return (this.conversation[index] as ChatBlob_Embed).isAI
    if (this.conversation[index].type === 'UserProfile')
      return (this.conversation[index] as ChatBlob_UserProfile).isAI
    return false
  }
  async submitToGPT(text: string, bDebug: boolean = true) {
    const systemMessage = {
      content:
        SYSTEM_MSG +
        ' The webpage DOM for reference is: "' +
        this.contextDocument +
        "'",
      role: ChatMessageRole.System,
    }
    const userMessageContent = text
    const userMessage = {
      content: userMessageContent,
      role: ChatMessageRole.User,
    }
    const msgList: ChatAssistantMessage[] = [
      systemMessage,
      ...this.getMessageHistory,
      userMessage,
    ]

    if (bDebug) {
      console.log('submitToGPT - systemMsg: ', msgList[0].content)
      for (let i = 1; i < msgList.length; ++i) {
        console.log(
          'submitToGPT - ',
          msgList[i].role === ChatMessageRole.User ? 'user' : 'gpt',
          i,
          ': ',
          msgList[i].content,
        )
      }
    }
    // Record the user message payload, to be re-issued in subsequent calls.
    this.addToChatMessageHistory_User(userMessageContent)

    try {
      this.setIsGeneratingChat(true)
      const response = await this.rootStore.waverlyAgent.api.promptGPT({
        messageList: msgList,
      })

      if (response.promptGPT) {
        // Record the response payload, to be re-issued in subsequent calls.
        this.addToChatMessageHistory_Assistant(response.promptGPT)

        // Break the text into newlines for rendering.
        const paragraphs = response.promptGPT.split('\n')
        paragraphs.map(p => this.addToConversation(p.trim(), true))
        this.onHasNewContent()
      }
    } catch (error) {
      this.rootStore.log.error(`WaverlyAgent.api.promptGPT`, error)
    } finally {
      this.setIsGeneratingChat(false)
    }
  }
  async generateSmartOptions(bDebug: boolean = false) {
    const smartOptions: string[] = []
    const systemMessage = {
      content:
        SYSTEM_MSG +
        ' The webpage DOM for reference is: "' +
        this.contextDocument +
        "'",
      role: ChatMessageRole.System,
    }
    const userMessageContent =
      'What are 8 short questions a user might ask WaverlyChat about the contents of this article?  Keep them very brief. Make them about the article itself and the authors, not about the capabilities of the webpage.  Make sure the questions have not already been asked by the user.  Each question should be unique from one another and interesting.'
    const userMessage = {
      content: userMessageContent,
      role: ChatMessageRole.User,
    }
    const msgList: ChatAssistantMessage[] = [
      systemMessage,
      ...this.getMessageHistory, // Including the history so that smart options can be generated considering the user's questions.
      userMessage,
    ]

    if (bDebug) {
      console.log('submitToGPT - systemMsg: ', msgList[0].content)
      for (let i = 1; i < msgList.length; ++i) {
        console.log(
          'submitToGPT - ',
          msgList[i].role === ChatMessageRole.User ? 'user' : 'gpt',
          i,
          ': ',
          msgList[i].content,
        )
      }
    }
    // Don't record the smart-options user message payload, to be re-issued in subsequent calls.
    //this.addToChatMessageHistory_User(userMessageContent)

    try {
      this.setIsGeneratingSmartOptions(true)
      const response = await this.rootStore.waverlyAgent.api.promptGPT({
        messageList: msgList,
      })

      if (response.promptGPT) {
        // Don't record the smart-options response payload, to be re-issued in subsequent calls.
        //this.addToChatMessageHistory_Assistant(response.promptGPT)

        // Break the text into newlines for rendering.
        const paragraphs = response.promptGPT.split('\n')
        paragraphs.map(p => smartOptions.push(p.trim()))
      }
    } catch (error) {
      this.rootStore.log.error(`WaverlyAgent.api.promptGPT`, error)
    } finally {
      this.setIsGeneratingSmartOptions(false)
      smartOptions.forEach((v: string, index: number) => {
        smartOptions[index] = v.replace(/^\d+./, '')
      })
      //smartOptions[1] = smartOptions[1].replace(/^\d+./, '')
      this.onHasNewSmartOptions(smartOptions)
    }
  }
}
