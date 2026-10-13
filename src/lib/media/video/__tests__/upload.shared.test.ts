import {type Client} from '@atproto/lex'

import {com} from '#/lexicons'
import {
  getServiceAuthToken,
  SERVICE_AUTH_TTL_SEC,
  serviceAuthExp,
} from '../upload.shared'

function createClient() {
  const call = jest.fn().mockResolvedValue({token: 'token'})
  return {client: {call} as unknown as Client, call}
}

describe('serviceAuthExp', () => {
  it('returns an integer even when the clock has sub-second precision', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_500)
    expect(serviceAuthExp()).toBe(1_700_000_000 + SERVICE_AUTH_TTL_SEC)
    expect(Number.isInteger(serviceAuthExp())).toBe(true)
  })

  it('accepts a custom ttl and keeps the result integral', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_999)
    expect(serviceAuthExp(90.7)).toBe(1_700_000_090)
  })
})

describe('getServiceAuthToken', () => {
  it('floors a fractional exp before sending it', async () => {
    const {client, call} = createClient()
    await getServiceAuthToken({
      client,
      aud: 'did:web:video.bsky.app',
      lxm: 'com.atproto.repo.uploadBlob',
      exp: 1_700_001_800.5,
    })
    expect(call).toHaveBeenCalledWith(com.atproto.server.getServiceAuth, {
      aud: 'did:web:video.bsky.app',
      lxm: 'com.atproto.repo.uploadBlob',
      exp: 1_700_001_800,
    })
  })

  it('leaves exp undefined when the caller omits it', async () => {
    const {client, call} = createClient()
    await getServiceAuthToken({
      client,
      aud: 'did:web:video.bsky.app',
      lxm: 'app.bsky.video.getUploadLimits',
    })
    expect(call).toHaveBeenCalledWith(com.atproto.server.getServiceAuth, {
      aud: 'did:web:video.bsky.app',
      lxm: 'app.bsky.video.getUploadLimits',
      exp: undefined,
    })
  })

  it('rejects a non-finite exp rather than sending NaN', async () => {
    const {client, call} = createClient()
    await expect(
      getServiceAuthToken({
        client,
        aud: 'did:web:video.bsky.app',
        lxm: 'com.atproto.repo.uploadBlob',
        exp: NaN,
      }),
    ).rejects.toThrow('Invalid service auth exp')
    expect(call).not.toHaveBeenCalled()
  })
})
