import {describe, it, expect} from '@jest/globals'
import {RichText} from '@atproto/api'

import {hasMutedWord} from '../moderatePost_wrapped'

describe(`hasMutedWord`, () => {
  describe(`tags`, () => {
    it(`match: outline tag`, () => {
      const rt = new RichText({
        text: `This is a post #inlineTag`,
      })
      rt.detectFacetsWithoutResolution()

      const match = hasMutedWord(
        [{value: 'outlineTag', targets: ['tag']}],
        rt.text,
        rt.facets,
        ['outlineTag'],
      )

      expect(match).toBe(true)
    })

    it(`match: inline tag`, () => {
      const rt = new RichText({
        text: `This is a post #inlineTag`,
      })
      rt.detectFacetsWithoutResolution()

      const match = hasMutedWord(
        [{value: 'inlineTag', targets: ['tag']}],
        rt.text,
        rt.facets,
        ['outlineTag'],
      )

      expect(match).toBe(true)
    })

    it(`match: content target matches inline tag`, () => {
      const rt = new RichText({
        text: `This is a post #inlineTag`,
      })
      rt.detectFacetsWithoutResolution()

      const match = hasMutedWord(
        [{value: 'inlineTag', targets: ['content']}],
        rt.text,
        rt.facets,
        ['outlineTag'],
      )

      expect(match).toBe(true)
    })

    it(`no match: only tag targets`, () => {
      const rt = new RichText({
        text: `This is a post`,
      })
      rt.detectFacetsWithoutResolution()

      const match = hasMutedWord(
        [{value: 'inlineTag', targets: ['tag']}],
        rt.text,
        rt.facets,
        [],
      )

      expect(match).toBe(false)
    })
  })

  describe(`early exits`, () => {
    it(`match: single character 希`, () => {
      /**
       * @see https://bsky.app/profile/mukuuji.bsky.social/post/3klji4fvsdk2c
       */
      const rt = new RichText({
        text: `改善希望です`,
      })
      rt.detectFacetsWithoutResolution()

      const match = hasMutedWord(
        [{value: '希', targets: ['content']}],
        rt.text,
        rt.facets,
        [],
      )

      expect(match).toBe(true)
    })

    it(`no match: long muted word, short post`, () => {
      const rt = new RichText({
        text: `hey`,
      })
      rt.detectFacetsWithoutResolution()

      const match = hasMutedWord(
        [{value: 'politics', targets: ['content']}],
        rt.text,
        rt.facets,
        [],
      )

      expect(match).toBe(false)
    })

    it(`match: exact text`, () => {
      const rt = new RichText({
        text: `javascript`,
      })
      rt.detectFacetsWithoutResolution()

      const match = hasMutedWord(
        [{value: 'javascript', targets: ['content']}],
        rt.text,
        rt.facets,
        [],
      )

      expect(match).toBe(true)
    })
  })

  describe(`general content`, () => {
    it(`match: word within post`, () => {
      const rt = new RichText({
        text: `This is a post about javascript`,
      })
      rt.detectFacetsWithoutResolution()

      const match = hasMutedWord(
        [{value: 'javascript', targets: ['content']}],
        rt.text,
        rt.facets,
        [],
      )

      expect(match).toBe(true)
    })

    it(`no match: partial word`, () => {
      const rt = new RichText({
        text: `Use your brain, Eric`,
      })
      rt.detectFacetsWithoutResolution()

      const match = hasMutedWord(
        [{value: 'ai', targets: ['content']}],
        rt.text,
        rt.facets,
        [],
      )

      expect(match).toBe(false)
    })

    it(`match: multiline`, () => {
      const rt = new RichText({
        text: `Use your\n\tbrain, Eric`,
      })
      rt.detectFacetsWithoutResolution()

      const match = hasMutedWord(
        [{value: 'brain', targets: ['content']}],
        rt.text,
        rt.facets,
        [],
      )

      expect(match).toBe(true)
    })

    it(`match: :)`, () => {
      const rt = new RichText({
        text: `So happy :)`,
      })
      rt.detectFacetsWithoutResolution()

      const match = hasMutedWord(
        [{value: `:)`, targets: ['content']}],
        rt.text,
        rt.facets,
        [],
      )

      expect(match).toBe(true)
    })
  })

  describe(`punctuation semi-fuzzy`, () => {
    describe(`yay!`, () => {
      const rt = new RichText({
        text: `We're federating, yay!`,
      })
      rt.detectFacetsWithoutResolution()

      it(`match: yay!`, () => {
        const match = hasMutedWord(
          [{value: 'yay!', targets: ['content']}],
          rt.text,
          rt.facets,
          [],
        )

        expect(match).toBe(true)
      })

      it(`match: yay`, () => {
        const match = hasMutedWord(
          [{value: 'yay', targets: ['content']}],
          rt.text,
          rt.facets,
          [],
        )

        expect(match).toBe(true)
      })
    })

    describe(`y!ppee!!`, () => {
      const rt = new RichText({
        text: `We're federating, y!ppee!!`,
      })
      rt.detectFacetsWithoutResolution()

      it(`match: y!ppee`, () => {
        const match = hasMutedWord(
          [{value: 'y!ppee', targets: ['content']}],
          rt.text,
          rt.facets,
          [],
        )

        expect(match).toBe(true)
      })

      // single exclamation point, source has double
      it(`no match: y!ppee!`, () => {
        const match = hasMutedWord(
          [{value: 'y!ppee!', targets: ['content']}],
          rt.text,
          rt.facets,
          [],
        )

        expect(match).toBe(true)
      })
    })

    describe(`Why so S@assy?`, () => {
      const rt = new RichText({
        text: `Why so S@assy?`,
      })
      rt.detectFacetsWithoutResolution()

      it(`match: S@assy`, () => {
        const match = hasMutedWord(
          [{value: 'S@assy', targets: ['content']}],
          rt.text,
          rt.facets,
          [],
        )

        expect(match).toBe(true)
      })

      it(`match: s@assy`, () => {
        const match = hasMutedWord(
          [{value: 's@assy', targets: ['content']}],
          rt.text,
          rt.facets,
          [],
        )

        expect(match).toBe(true)
      })
    })

    describe(`New York Times`, () => {
      const rt = new RichText({
        text: `New York Times`,
      })
      rt.detectFacetsWithoutResolution()

      // case insensitive
      it(`match: new york times`, () => {
        const match = hasMutedWord(
          [{value: 'new york times', targets: ['content']}],
          rt.text,
          rt.facets,
          [],
        )

        expect(match).toBe(true)
      })
    })

    describe(`!command`, () => {
      const rt = new RichText({
        text: `Idk maybe a bot !command`,
      })
      rt.detectFacetsWithoutResolution()

      it(`match: !command`, () => {
        const match = hasMutedWord(
          [{value: `!command`, targets: ['content']}],
          rt.text,
          rt.facets,
          [],
        )

        expect(match).toBe(true)
      })

      it(`match: command`, () => {
        const match = hasMutedWord(
          [{value: `command`, targets: ['content']}],
          rt.text,
          rt.facets,
          [],
        )

        expect(match).toBe(true)
      })

      it(`no match: !command`, () => {
        const rt = new RichText({
          text: `Idk maybe a bot command`,
        })
        rt.detectFacetsWithoutResolution()

        const match = hasMutedWord(
          [{value: `!command`, targets: ['content']}],
          rt.text,
          rt.facets,
          [],
        )

        expect(match).toBe(false)
      })
    })

    describe(`e/acc`, () => {
      const rt = new RichText({
        text: `I'm e/acc pilled`,
      })
      rt.detectFacetsWithoutResolution()

      it(`match: e/acc`, () => {
        const match = hasMutedWord(
          [{value: `e/acc`, targets: ['content']}],
          rt.text,
          rt.facets,
          [],
        )

        expect(match).toBe(true)
      })

      it(`match: acc`, () => {
        const match = hasMutedWord(
          [{value: `acc`, targets: ['content']}],
          rt.text,
          rt.facets,
          [],
        )

        expect(match).toBe(true)
      })
    })

    describe(`super-bad`, () => {
      const rt = new RichText({
        text: `I'm super-bad`,
      })
      rt.detectFacetsWithoutResolution()

      it(`match: super-bad`, () => {
        const match = hasMutedWord(
          [{value: `super-bad`, targets: ['content']}],
          rt.text,
          rt.facets,
          [],
        )

        expect(match).toBe(true)
      })

      it(`match: super`, () => {
        const match = hasMutedWord(
          [{value: `super`, targets: ['content']}],
          rt.text,
          rt.facets,
          [],
        )

        expect(match).toBe(true)
      })

      it(`match: super bad`, () => {
        const match = hasMutedWord(
          [{value: `super bad`, targets: ['content']}],
          rt.text,
          rt.facets,
          [],
        )

        expect(match).toBe(true)
      })

      it(`match: superbad`, () => {
        const match = hasMutedWord(
          [{value: `superbad`, targets: ['content']}],
          rt.text,
          rt.facets,
          [],
        )

        expect(match).toBe(false)
      })
    })

    describe(`idk_what_this_would_be`, () => {
      const rt = new RichText({
        text: `Weird post with idk_what_this_would_be`,
      })
      rt.detectFacetsWithoutResolution()

      it(`match: idk what this would be`, () => {
        const match = hasMutedWord(
          [{value: `idk what this would be`, targets: ['content']}],
          rt.text,
          rt.facets,
          [],
        )

        expect(match).toBe(true)
      })

      it(`no match: idk what this would be for`, () => {
        // extra word
        const match = hasMutedWord(
          [{value: `idk what this would be for`, targets: ['content']}],
          rt.text,
          rt.facets,
          [],
        )

        expect(match).toBe(false)
      })

      it(`match: idk`, () => {
        // extra word
        const match = hasMutedWord(
          [{value: `idk`, targets: ['content']}],
          rt.text,
          rt.facets,
          [],
        )

        expect(match).toBe(true)
      })

      it(`match: idkwhatthiswouldbe`, () => {
        const match = hasMutedWord(
          [{value: `idkwhatthiswouldbe`, targets: ['content']}],
          rt.text,
          rt.facets,
          [],
        )

        expect(match).toBe(false)
      })
    })

    describe(`parentheses`, () => {
      const rt = new RichText({
        text: `Post with context(iykyk)`,
      })
      rt.detectFacetsWithoutResolution()

      it(`match: context(iykyk)`, () => {
        const match = hasMutedWord(
          [{value: `context(iykyk)`, targets: ['content']}],
          rt.text,
          rt.facets,
          [],
        )

        expect(match).toBe(true)
      })

      it(`match: context`, () => {
        const match = hasMutedWord(
          [{value: `context`, targets: ['content']}],
          rt.text,
          rt.facets,
          [],
        )

        expect(match).toBe(true)
      })

      it(`match: iykyk`, () => {
        const match = hasMutedWord(
          [{value: `iykyk`, targets: ['content']}],
          rt.text,
          rt.facets,
          [],
        )

        expect(match).toBe(true)
      })

      it(`match: (iykyk)`, () => {
        const match = hasMutedWord(
          [{value: `(iykyk)`, targets: ['content']}],
          rt.text,
          rt.facets,
          [],
        )

        expect(match).toBe(true)
      })
    })

    describe(`🦋`, () => {
      const rt = new RichText({
        text: `Post with 🦋`,
      })
      rt.detectFacetsWithoutResolution()

      it(`match: 🦋`, () => {
        const match = hasMutedWord(
          [{value: `🦋`, targets: ['content']}],
          rt.text,
          rt.facets,
          [],
        )

        expect(match).toBe(true)
      })
    })
  })

  describe(`phrases`, () => {
    describe(`I like turtles, or how I learned to stop worrying and love the internet.`, () => {
      const rt = new RichText({
        text: `I like turtles, or how I learned to stop worrying and love the internet.`,
      })
      rt.detectFacetsWithoutResolution()

      it(`match: stop worrying`, () => {
        const match = hasMutedWord(
          [{value: 'stop worrying', targets: ['content']}],
          rt.text,
          rt.facets,
          [],
        )

        expect(match).toBe(true)
      })

      it(`match: turtles, or how`, () => {
        const match = hasMutedWord(
          [{value: 'turtles, or how', targets: ['content']}],
          rt.text,
          rt.facets,
          [],
        )

        expect(match).toBe(true)
      })
    })
  })
})
