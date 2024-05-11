import {describe, it} from '@jest/globals'

describe(`#/state/messages/convo`, () => {
  describe(`init`, () => {
    it.todo(`fails if sender and recipients aren't found`)
    it.todo(`cannot re-initialize from a non-unintialized state`)
    it.todo(`can re-initialize from a failed state`)
  })

  describe(`resume`, () => {
    it.todo(`restores previous state if resume fails`)
  })

  describe(`suspend`, () => {
    it.todo(`cannot be interacted with when suspended`)
    it.todo(`polling is stopped when suspended`)
  })

  describe(`read states`, () => {
    it.todo(`should mark messages as read as they come in`)
  })

  describe(`history fetching`, () => {
    it.todo(`fetches initial chat history`)
    it.todo(`fetches additional chat history`)
    it.todo(`handles history fetch failure`)
    it.todo(`does not insert deleted messages`)
  })

  describe(`sending messages`, () => {
    it.todo(`optimistically adds sending messages`)
    it.todo(`sends messages in order`)
    it.todo(`failed message send fails all sending messages`)
    it.todo(`can retry all failed messages via retry ConvoItem`)
    it.todo(
      `successfully sent messages are re-ordered, if needed, by events received from server`,
    )
    it.todo(`pending messages are cleaned up from state after firehose event`)
  })

  describe(`deleting messages`, () => {
    it.todo(`messages are optimistically deleted from the chat`)
    it.todo(`messages are confirmed deleted via events from the server`)
    it.todo(`deleted messages are cleaned up from state after firehose event`)
  })

  describe(`log handling`, () => {
    it.todo(`updates rev to latest message received`)
    it.todo(`only handles log events for this convoId`)
    it.todo(`does not insert deleted messages`)
  })

  describe(`item ordering`, () => {
    it.todo(`pending items are first, and in order`)
    it.todo(`new message items are next, and in order`)
    it.todo(`past message items are next, and in order`)
  })

  describe(`inactivity`, () => {
    it.todo(
      `below a certain threshold of inactivity, restore entirely from log`,
    )
    it.todo(
      `above a certain threshold of inactivity, rehydrate entirely fresh state`,
    )
  })
})
