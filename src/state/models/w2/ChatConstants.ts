import {ChatAssistantMessage, ChatMessageRole} from 'w2-api/waverly_sdk'

/* WordDJ Dev Constants */
export const GENERATE_POST_SYSTEM_MESSAGE = `You take an idea proposed by the user, in the form of a short piece of text, and transform it into a compelling post that is roughly 100 words long. Provide the post in segments, where each segment is on a new line. When the segments are put together, they form a top-tier social media post.`

export const GENERATE_BOOSTER_SYSTEM_MESSAGE = `You will be given a social media post. Respond with stimulating ideas that can be included in the post to make it more engaging. Each idea you return should be on a new line. Ideas should be expressed as 10 words or less.`

export const MIX_ACTION_SYSTEM_MESSAGE = `You will be given a numbered list of paragraphs. Each list item represents a segment of a social media post. The concatenation of each list item represents a social media post as a whole.
In addition, you will be given an idea in the form of "Idea: " and a list of numbers "Numbers: " representing which numbered items you can augment with the provided Idea if you see fit. You should enhance some or all of the selected segments such that the social media post as a whole remains coherent and includes the provided idea.
You should return only the entire numbered list provided with the corresponding changes you made.`

export const REPHRASE_ACTION_SYSTEM_MESSAGE = `You are an assistant that takes in a passage from the user. You rephrase the passage and return it to the user with the goal of making it more compelling.`

export const ADD_IDEA_TO_BLOCK_SYSTEM_MESSAGE = `Infuse $IDEA into $PASSAGE and return the result in one block of text no longer than 35 words.`

export const ADD_BLOCK_SYSTEM_MESSAGE = `The user will share a post with you. Articulate a stimulating idea in 25 words or less that will augment the post.`

export const MODIFY_TONE_SYSTEM_MESSAGE = `Rewrite the user passage in the tone: `

export const MODIFY_LENGTH_SYSTEM_MESSAGE = `Rewrite the user passage to be `

export const GENERATE_BLOCK_BY_SELECTING_IDEA_SYSTEM_MESSAGE = `based on the user input to make it better. Your response should be 20 words or less.`

/*
Format GPT prompt settings as ChatAssistantMessage[]
because this is the input to make an API call to chatGPT
*/

export const GENERATE_POST_MESSAGES: ChatAssistantMessage[] = [
  {
    content: GENERATE_POST_SYSTEM_MESSAGE,
    role: ChatMessageRole.System,
  },
]

export const GENERATE_BOOSTER_MESSAGES: ChatAssistantMessage[] = [
  {
    content: GENERATE_BOOSTER_SYSTEM_MESSAGE,
    role: ChatMessageRole.System,
  },
]

export const MIX_ACTION_MESSAGES: ChatAssistantMessage[] = [
  {
    content: MIX_ACTION_SYSTEM_MESSAGE,
    role: ChatMessageRole.System,
  },
]

export const REPHRASE_ACTION_MESSAGES: ChatAssistantMessage[] = [
  {
    content: REPHRASE_ACTION_SYSTEM_MESSAGE,
    role: ChatMessageRole.System,
  },
]

export const ADD_IDEA_TO_BLOCK_MESSAGES: ChatAssistantMessage[] = [
  {
    content: ADD_IDEA_TO_BLOCK_SYSTEM_MESSAGE,
    role: ChatMessageRole.System,
  },
]

export const MODIFY_TONE_MESSAGES: ChatAssistantMessage[] = [
  {
    content: MODIFY_TONE_SYSTEM_MESSAGE,
    role: ChatMessageRole.System,
  },
]

export const MODIFY_LENGTH_MESSAGES: ChatAssistantMessage[] = [
  {
    content: MODIFY_LENGTH_SYSTEM_MESSAGE,
    role: ChatMessageRole.System,
  },
]

export const GENERATE_BLOCK_BY_SELECTING_IDEA_MESSAGES: ChatAssistantMessage[] =
  [
    {
      content: GENERATE_BLOCK_BY_SELECTING_IDEA_SYSTEM_MESSAGE,
      role: ChatMessageRole.System,
    },
  ]
