import {describe, it} from '@jest/globals'

describe(`#/state/dms/client`, () => {
  describe(`ChatsService`, () => {
    describe(`unread count`, () => {
      it.todo(`marks a chat as read, decrements total unread count`)
    })

    describe(`log processing`, () => {
      /*
       * We receive a new chat log AND messages for it in the same batch. We
       * need to first initialize the chat, then process the received logs.
       */
      describe(`handles new chats and subsequent messages received in same log batch`, () => {
        it.todo(`receives new chat and messages`)
        it.todo(
          `receives new chat, new messages come in while still initializing new chat`,
        )
      })
    })

    describe(`reset state`, () => {
      it.todo(`after period of inactivity, rehydrates entirely fresh state`)
    })
  })

  describe(`ChatService`, () => {
    describe(`history fetching`, () => {
      it.todo(`fetches initial chat history`)
      it.todo(`fetches additional chat history`)
      it.todo(`handles history fetch failure`)
    })

    describe(`optimistic updates`, () => {
      it.todo(`adds sending messages`)
    })
  })
})
