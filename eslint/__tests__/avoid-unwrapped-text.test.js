const {RuleTester} = require('eslint')
const avoidUnwrappedText = require('../avoid-unwrapped-text')

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 6,
    sourceType: 'module',
  },
})

describe('prefer-lingui-msg', () => {
  const tests = {
    valid: [
      {
        code: `
<Text>
  foo
</Text>
        `,
      },

      {
        code: `
<Text>
  {bar}
</Text>
        `,
      },

      {
        code: `
<View>
  {bar}
</View>
        `,
      },

      {
        code: `
<Text>
  foo {bar}
</Text>
        `,
      },

      {
        code: `
<View>
  <Text>
    foo
  </Text>
</View>
        `,
      },

      {
        code: `
<View>
  <Text>
    {bar}
  </Text>
</View>
        `,
      },

      {
        code: `
<View>
  <Text>
    foo {bar}
  </Text>
</View>
        `,
      },
    ],

    invalid: [
      {
        code: `
<View>
  foo
</View>
        `,
        errors: 1,
      },

      {
        code: `
<View>
  foo {bar}
</View>
        `,
        errors: 1,
      },

      {
        code: `
<View>
  <View>
    foo
  </View>
</View>
        `,
        errors: 1,
      },

      {
        // That's actually kind of allowed but let's avoid for now.'
        code: `
<Text>
  <View>
    foo
  </View>
</Text>
        `,
        errors: 1,
      },
    ],
  }

  // For easier local testing
  if (!process.env.CI) {
    let only = []
    let skipped = []
    ;[...tests.valid, ...tests.invalid].forEach(t => {
      if (t.skip) {
        delete t.skip
        skipped.push(t)
      }
      if (t.only) {
        delete t.only
        only.push(t)
      }
    })
    const predicate = t => {
      if (only.length > 0) {
        return only.indexOf(t) !== -1
      }
      if (skipped.length > 0) {
        return skipped.indexOf(t) === -1
      }
      return true
    }
    tests.valid = tests.valid.filter(predicate)
    tests.invalid = tests.invalid.filter(predicate)
  }
  ruleTester.run('avoid-unwrapped-text', avoidUnwrappedText, tests)
})
