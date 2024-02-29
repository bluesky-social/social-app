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

      const match = hasMutedWord({
        mutedWords: [{value: 'outlineTag', targets: ['tag']}],
        text: rt.text,
        facets: rt.facets,
        outlineTags: ['outlineTag'],
      })

      expect(match).toBe(true)
    })

    it(`match: inline tag`, () => {
      const rt = new RichText({
        text: `This is a post #inlineTag`,
      })
      rt.detectFacetsWithoutResolution()

      const match = hasMutedWord({
        mutedWords: [{value: 'inlineTag', targets: ['tag']}],
        text: rt.text,
        facets: rt.facets,
        outlineTags: ['outlineTag'],
      })

      expect(match).toBe(true)
    })

    it(`match: content target matches inline tag`, () => {
      const rt = new RichText({
        text: `This is a post #inlineTag`,
      })
      rt.detectFacetsWithoutResolution()

      const match = hasMutedWord({
        mutedWords: [{value: 'inlineTag', targets: ['content']}],
        text: rt.text,
        facets: rt.facets,
        outlineTags: ['outlineTag'],
      })

      expect(match).toBe(true)
    })

    it(`no match: only tag targets`, () => {
      const rt = new RichText({
        text: `This is a post`,
      })
      rt.detectFacetsWithoutResolution()

      const match = hasMutedWord({
        mutedWords: [{value: 'inlineTag', targets: ['tag']}],
        text: rt.text,
        facets: rt.facets,
        outlineTags: [],
      })

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

      const match = hasMutedWord({
        mutedWords: [{value: '希', targets: ['content']}],
        text: rt.text,
        facets: rt.facets,
        outlineTags: [],
      })

      expect(match).toBe(true)
    })

    it(`no match: long muted word, short post`, () => {
      const rt = new RichText({
        text: `hey`,
      })
      rt.detectFacetsWithoutResolution()

      const match = hasMutedWord({
        mutedWords: [{value: 'politics', targets: ['content']}],
        text: rt.text,
        facets: rt.facets,
        outlineTags: [],
      })

      expect(match).toBe(false)
    })

    it(`match: exact text`, () => {
      const rt = new RichText({
        text: `javascript`,
      })
      rt.detectFacetsWithoutResolution()

      const match = hasMutedWord({
        mutedWords: [{value: 'javascript', targets: ['content']}],
        text: rt.text,
        facets: rt.facets,
        outlineTags: [],
      })

      expect(match).toBe(true)
    })
  })

  describe(`general content`, () => {
    it(`match: word within post`, () => {
      const rt = new RichText({
        text: `This is a post about javascript`,
      })
      rt.detectFacetsWithoutResolution()

      const match = hasMutedWord({
        mutedWords: [{value: 'javascript', targets: ['content']}],
        text: rt.text,
        facets: rt.facets,
        outlineTags: [],
      })

      expect(match).toBe(true)
    })

    it(`no match: partial word`, () => {
      const rt = new RichText({
        text: `Use your brain, Eric`,
      })
      rt.detectFacetsWithoutResolution()

      const match = hasMutedWord({
        mutedWords: [{value: 'ai', targets: ['content']}],
        text: rt.text,
        facets: rt.facets,
        outlineTags: [],
      })

      expect(match).toBe(false)
    })

    it(`match: multiline`, () => {
      const rt = new RichText({
        text: `Use your\n\tbrain, Eric`,
      })
      rt.detectFacetsWithoutResolution()

      const match = hasMutedWord({
        mutedWords: [{value: 'brain', targets: ['content']}],
        text: rt.text,
        facets: rt.facets,
        outlineTags: [],
      })

      expect(match).toBe(true)
    })

    it(`match: :)`, () => {
      const rt = new RichText({
        text: `So happy :)`,
      })
      rt.detectFacetsWithoutResolution()

      const match = hasMutedWord({
        mutedWords: [{value: `:)`, targets: ['content']}],
        text: rt.text,
        facets: rt.facets,
        outlineTags: [],
      })

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
        const match = hasMutedWord({
          mutedWords: [{value: 'yay!', targets: ['content']}],
          text: rt.text,
          facets: rt.facets,
          outlineTags: [],
        })

        expect(match).toBe(true)
      })

      it(`match: yay`, () => {
        const match = hasMutedWord({
          mutedWords: [{value: 'yay', targets: ['content']}],
          text: rt.text,
          facets: rt.facets,
          outlineTags: [],
        })

        expect(match).toBe(true)
      })
    })

    describe(`y!ppee!!`, () => {
      const rt = new RichText({
        text: `We're federating, y!ppee!!`,
      })
      rt.detectFacetsWithoutResolution()

      it(`match: y!ppee`, () => {
        const match = hasMutedWord({
          mutedWords: [{value: 'y!ppee', targets: ['content']}],
          text: rt.text,
          facets: rt.facets,
          outlineTags: [],
        })

        expect(match).toBe(true)
      })

      // single exclamation point, source has double
      it(`no match: y!ppee!`, () => {
        const match = hasMutedWord({
          mutedWords: [{value: 'y!ppee!', targets: ['content']}],
          text: rt.text,
          facets: rt.facets,
          outlineTags: [],
        })

        expect(match).toBe(true)
      })
    })

    describe(`Why so S@assy?`, () => {
      const rt = new RichText({
        text: `Why so S@assy?`,
      })
      rt.detectFacetsWithoutResolution()

      it(`match: S@assy`, () => {
        const match = hasMutedWord({
          mutedWords: [{value: 'S@assy', targets: ['content']}],
          text: rt.text,
          facets: rt.facets,
          outlineTags: [],
        })

        expect(match).toBe(true)
      })

      it(`match: s@assy`, () => {
        const match = hasMutedWord({
          mutedWords: [{value: 's@assy', targets: ['content']}],
          text: rt.text,
          facets: rt.facets,
          outlineTags: [],
        })

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
        const match = hasMutedWord({
          mutedWords: [{value: 'new york times', targets: ['content']}],
          text: rt.text,
          facets: rt.facets,
          outlineTags: [],
        })

        expect(match).toBe(true)
      })
    })

    describe(`!command`, () => {
      const rt = new RichText({
        text: `Idk maybe a bot !command`,
      })
      rt.detectFacetsWithoutResolution()

      it(`match: !command`, () => {
        const match = hasMutedWord({
          mutedWords: [{value: `!command`, targets: ['content']}],
          text: rt.text,
          facets: rt.facets,
          outlineTags: [],
        })

        expect(match).toBe(true)
      })

      it(`match: command`, () => {
        const match = hasMutedWord({
          mutedWords: [{value: `command`, targets: ['content']}],
          text: rt.text,
          facets: rt.facets,
          outlineTags: [],
        })

        expect(match).toBe(true)
      })

      it(`no match: !command`, () => {
        const rt = new RichText({
          text: `Idk maybe a bot command`,
        })
        rt.detectFacetsWithoutResolution()

        const match = hasMutedWord({
          mutedWords: [{value: `!command`, targets: ['content']}],
          text: rt.text,
          facets: rt.facets,
          outlineTags: [],
        })

        expect(match).toBe(false)
      })
    })

    describe(`e/acc`, () => {
      const rt = new RichText({
        text: `I'm e/acc pilled`,
      })
      rt.detectFacetsWithoutResolution()

      it(`match: e/acc`, () => {
        const match = hasMutedWord({
          mutedWords: [{value: `e/acc`, targets: ['content']}],
          text: rt.text,
          facets: rt.facets,
          outlineTags: [],
        })

        expect(match).toBe(true)
      })

      it(`match: acc`, () => {
        const match = hasMutedWord({
          mutedWords: [{value: `acc`, targets: ['content']}],
          text: rt.text,
          facets: rt.facets,
          outlineTags: [],
        })

        expect(match).toBe(true)
      })
    })

    describe(`super-bad`, () => {
      const rt = new RichText({
        text: `I'm super-bad`,
      })
      rt.detectFacetsWithoutResolution()

      it(`match: super-bad`, () => {
        const match = hasMutedWord({
          mutedWords: [{value: `super-bad`, targets: ['content']}],
          text: rt.text,
          facets: rt.facets,
          outlineTags: [],
        })

        expect(match).toBe(true)
      })

      it(`match: super`, () => {
        const match = hasMutedWord({
          mutedWords: [{value: `super`, targets: ['content']}],
          text: rt.text,
          facets: rt.facets,
          outlineTags: [],
        })

        expect(match).toBe(true)
      })

      it(`match: super bad`, () => {
        const match = hasMutedWord({
          mutedWords: [{value: `super bad`, targets: ['content']}],
          text: rt.text,
          facets: rt.facets,
          outlineTags: [],
        })

        expect(match).toBe(true)
      })

      it(`match: superbad`, () => {
        const match = hasMutedWord({
          mutedWords: [{value: `superbad`, targets: ['content']}],
          text: rt.text,
          facets: rt.facets,
          outlineTags: [],
        })

        expect(match).toBe(false)
      })
    })

    describe(`idk_what_this_would_be`, () => {
      const rt = new RichText({
        text: `Weird post with idk_what_this_would_be`,
      })
      rt.detectFacetsWithoutResolution()

      it(`match: idk what this would be`, () => {
        const match = hasMutedWord({
          mutedWords: [{value: `idk what this would be`, targets: ['content']}],
          text: rt.text,
          facets: rt.facets,
          outlineTags: [],
        })

        expect(match).toBe(true)
      })

      it(`no match: idk what this would be for`, () => {
        // extra word
        const match = hasMutedWord({
          mutedWords: [
            {value: `idk what this would be for`, targets: ['content']},
          ],
          text: rt.text,
          facets: rt.facets,
          outlineTags: [],
        })

        expect(match).toBe(false)
      })

      it(`match: idk`, () => {
        // extra word
        const match = hasMutedWord({
          mutedWords: [{value: `idk`, targets: ['content']}],
          text: rt.text,
          facets: rt.facets,
          outlineTags: [],
        })

        expect(match).toBe(true)
      })

      it(`match: idkwhatthiswouldbe`, () => {
        const match = hasMutedWord({
          mutedWords: [{value: `idkwhatthiswouldbe`, targets: ['content']}],
          text: rt.text,
          facets: rt.facets,
          outlineTags: [],
        })

        expect(match).toBe(false)
      })
    })

    describe(`parentheses`, () => {
      const rt = new RichText({
        text: `Post with context(iykyk)`,
      })
      rt.detectFacetsWithoutResolution()

      it(`match: context(iykyk)`, () => {
        const match = hasMutedWord({
          mutedWords: [{value: `context(iykyk)`, targets: ['content']}],
          text: rt.text,
          facets: rt.facets,
          outlineTags: [],
        })

        expect(match).toBe(true)
      })

      it(`match: context`, () => {
        const match = hasMutedWord({
          mutedWords: [{value: `context`, targets: ['content']}],
          text: rt.text,
          facets: rt.facets,
          outlineTags: [],
        })

        expect(match).toBe(true)
      })

      it(`match: iykyk`, () => {
        const match = hasMutedWord({
          mutedWords: [{value: `iykyk`, targets: ['content']}],
          text: rt.text,
          facets: rt.facets,
          outlineTags: [],
        })

        expect(match).toBe(true)
      })

      it(`match: (iykyk)`, () => {
        const match = hasMutedWord({
          mutedWords: [{value: `(iykyk)`, targets: ['content']}],
          text: rt.text,
          facets: rt.facets,
          outlineTags: [],
        })

        expect(match).toBe(true)
      })
    })

    describe(`🦋`, () => {
      const rt = new RichText({
        text: `Post with 🦋`,
      })
      rt.detectFacetsWithoutResolution()

      it(`match: 🦋`, () => {
        const match = hasMutedWord({
          mutedWords: [{value: `🦋`, targets: ['content']}],
          text: rt.text,
          facets: rt.facets,
          outlineTags: [],
        })

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
        const match = hasMutedWord({
          mutedWords: [{value: 'stop worrying', targets: ['content']}],
          text: rt.text,
          facets: rt.facets,
          outlineTags: [],
        })

        expect(match).toBe(true)
      })

      it(`match: turtles, or how`, () => {
        const match = hasMutedWord({
          mutedWords: [{value: 'turtles, or how', targets: ['content']}],
          text: rt.text,
          facets: rt.facets,
          outlineTags: [],
        })

        expect(match).toBe(true)
      })
    })
  })

  describe(`languages without spaces`, () => {
    // I love turtles, or how I learned to stop worrying and love the internet
    describe(`私はカメが好きです、またはどのようにして心配するのをやめてインターネットを愛するようになったのか`, () => {
      const rt = new RichText({
        text: `私はカメが好きです、またはどのようにして心配するのをやめてインターネットを愛するようになったのか`,
      })
      rt.detectFacetsWithoutResolution()

      // internet
      it(`match: インターネット`, () => {
        const match = hasMutedWord({
          mutedWords: [{value: 'インターネット', targets: ['content']}],
          text: rt.text,
          facets: rt.facets,
          outlineTags: [],
          languages: ['ja'],
        })

        expect(match).toBe(true)
      })
    })
  })
})
