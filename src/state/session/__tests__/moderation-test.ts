import {type Client} from '@atproto/lex'
import {api} from '@bsky/sdk'
import {beforeEach, describe, expect, it, jest} from '@jest/globals'

jest.mock('#/storage', () => ({
  account: {
    get: jest.fn(),
    set: jest.fn(),
  },
  device: {
    get: jest.fn(),
  },
}))

import {account} from '#/storage'
import {configureGlobalAppLabelers} from '../additional-moderation-authorities'
import {configureModerationForAccount} from '../moderation'
import {makeAccount} from './mock-fetch'

describe('configureModerationForAccount', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    configureGlobalAppLabelers([])
  })

  it('applies cached account labelers to appview and chat', () => {
    const appviewClient = {setLabelers: jest.fn()} as unknown as Client
    const chatClient = {setLabelers: jest.fn()} as unknown as Client
    jest
      .mocked(account.get)
      .mockReturnValue(['did:plc:account-labeler', api.moderation.did])

    configureModerationForAccount(
      {appviewClient, chatClient},
      makeAccount({handle: 'alice.example.com'}),
    )

    expect(appviewClient.setLabelers).toHaveBeenCalledWith([
      'did:plc:account-labeler',
    ])
    expect(chatClient.setLabelers).toHaveBeenCalledWith([
      'did:plc:account-labeler',
    ])
  })
})
