import {describe, expect, it} from '@jest/globals'

import {parseSearchQuery} from '#/screens/Search/utils'

describe(`parseSearchQuery`, () => {
  const tests = [
    {
      input: `gander`,
      output: {query: `gander`, params: {}},
    },
    {
      input: `gander from:esb.lol`,
      output: {query: `gander`, params: {from: `esb.lol`}},
    },
    {
      input: `gander "from:esb.lol"`,
      output: {query: `gander "from:esb.lol"`, params: {}},
    },
    {
      input: `gander mentions:@esb.lol`,
      output: {query: `gander`, params: {mentions: `@esb.lol`}},
    },
    {
      input: `gander since:2021-01-01:00:00:00`,
      output: {query: `gander`, params: {since: `2021-01-01:00:00:00`}},
    },
    {
      input: `gander lang:"en"`,
      output: {query: `gander`, params: {lang: `en`}},
    },
    {
      input: `gander "literal" lang:en "from:invalid"`,
      output: {query: `gander "literal" "from:invalid"`, params: {lang: `en`}},
    },
  ]

  it.each(tests)(
    `$input -> $output.query $output.params`,
    ({input, output}) => {
      expect(parseSearchQuery(input)).toEqual(output)
    },
  )
})
