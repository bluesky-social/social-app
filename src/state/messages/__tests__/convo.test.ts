import {describe, it} from '@jest/globals'

describe(`#/state/messages/convo`, () => {
  describe(`status states`, () => {
    it.todo(`cannot re-initialize from a non-unintialized state`)
    it.todo(`can re-initialize from a failed state`)

    describe(`destroy`, () => {
      it.todo(`cannot be interacted with when destroyed`)
      it.todo(`polling is stopped when destroyed`)
      it.todo(`events are cleaned up when destroyed`)
    })
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
  })

  describe(`deleting messages`, () => {
    it.todo(`messages are optimistically deleted from the chat`)
    it.todo(`messages are confirmed deleted via events from the server`)
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
