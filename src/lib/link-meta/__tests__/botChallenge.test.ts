import {isBotChallengeTitle} from '#/lib/link-meta/botChallenge'
import {getLinkMeta} from '#/lib/link-meta/link-meta'

describe('isBotChallengeTitle', () => {
  it.each([
    ["Making sure you're not a bot!", true],
    ['Making sure you&#39;re not a bot!', true],
    ['Making sure you&apos;re not a bot!', true],
    ['Making sure you’re not a bot!', true],
    ['  Dein Browser wird geprüft!  ', true],
    ['正在确认你是不是机器人！', true],
    ['Just a moment...', true],
    ['Just a moment…', true],
    ['Just a moment', false],
    ['Making sure you are not a bot', false],
    ['GNOME / gtk · GitLab', false],
    ['', false],
    [undefined, false],
  ])('%p -> %p', (title, expected) => {
    expect(isBotChallengeTitle(title)).toBe(expected)
  })
})

describe('getLinkMeta', () => {
  const fetchMock = jest.fn<Promise<unknown>, [string, RequestInit?]>()

  beforeEach(() => {
    fetchMock.mockReset()
    global.fetch = fetchMock as unknown as typeof fetch
  })

  function cardyb(fields: Record<string, string>) {
    const body = {
      error: '',
      url: 'https://lore.kernel.org/all/x/',
      title: '',
      description: '',
      image: '',
      ...fields,
    }
    return {json: () => Promise.resolve(body)}
  }

  it('returns a bare link when cardyb scraped a bot interstitial', async () => {
    // what cardyb returns for lore.kernel.org
    fetchMock.mockResolvedValueOnce(
      cardyb({
        title: "Making sure you're not a bot!",
        description: 'interstitial',
        image: 'https://cardyb.bsky.app/v1/image?url=anubis.webp',
      }),
    )

    const meta = await getLinkMeta('https://lore.kernel.org/all/x/')

    expect(meta.url).toBe('https://lore.kernel.org/all/x/')
    expect(meta.title).toBeUndefined()
    expect(meta.description).toBeUndefined()
    expect(meta.image).toBeUndefined()
    expect(meta.error).toBeUndefined()
  })

  it('leaves normal cardyb results alone', async () => {
    fetchMock.mockResolvedValueOnce(
      cardyb({title: 'Fedora Forge', description: 'A forge.'}),
    )

    const meta = await getLinkMeta('https://lore.kernel.org/all/x/')

    expect(meta.title).toBe('Fedora Forge')
    expect(meta.description).toBe('A forge.')
  })
})
