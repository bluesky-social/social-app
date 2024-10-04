import {describe, expect, it} from '@jest/globals'

import {parseSearchQuery} from '#/screens/Search/utils'

describe(`parseSearchQuery`, () => {
  const tests = [
    {
      input: `bluesky`,
      output: {query: `bluesky`, params: {}},
    },
    {
      input: `bluesky from:esb.lol`,
      output: {query: `bluesky`, params: {from: `esb.lol`}},
    },
    {
      input: `bluesky "from:esb.lol"`,
      output: {query: `bluesky "from:esb.lol"`, params: {}},
    },
    {
      input: `bluesky mentions:@esb.lol`,
      output: {query: `bluesky`, params: {mentions: `@esb.lol`}},
    },
    {
      input: `bluesky since:2021-01-01:00:00:00`,
      output: {query: `bluesky`, params: {since: `2021-01-01:00:00:00`}},
    },
    {
      input: `bluesky lang:"en"`,
      output: {query: `bluesky`, params: {lang: `en`}},
    },
    {
      input: `bluesky "literal" lang:en "from:invalid"`,
      output: {query: `bluesky "literal" "from:invalid"`, params: {lang: `en`}},
    },
  ]

  it.each(tests)(
    `$input -> $output.query $output.params`,
    ({input, output}) => {
      expect(parseSearchQuery(input)).toEqual(output)
    },
  )
})
