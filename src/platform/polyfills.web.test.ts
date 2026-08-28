import {RichText} from '@bsky/sdk/richtext'

describe('web polyfills', () => {
  const nativeStructuredClone = globalThis.structuredClone

  afterEach(() => {
    globalThis.structuredClone = nativeStructuredClone
  })

  it('supports rich text when structuredClone is unavailable', async () => {
    Reflect.deleteProperty(globalThis, 'structuredClone')

    let structuredCloneReady: Promise<void> | undefined
    jest.isolateModules(() => {
      const polyfills =
        require('./polyfills.web') as typeof import('./polyfills.web')
      structuredCloneReady = polyfills.structuredCloneReady
    })
    await structuredCloneReady

    const richText = new RichText(
      {text: 'hello\n\n\nworld'},
      {cleanNewlines: true},
    )

    expect(richText.text).toBe('hello\n\nworld')
    expect(richText.clone()).toEqual(richText)
  })
})
