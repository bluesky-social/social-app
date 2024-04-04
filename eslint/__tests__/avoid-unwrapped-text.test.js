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

describe('avoid-unwrapped-text', () => {
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
  <Trans>
    foo
  </Trans>
</Text>
        `,
      },

      {
        code: `
<Text>
  <>
    foo
  </>
</Text>
        `,
      },

      {
        code: `
<Text>
  {foo && <Trans>foo</Trans>}
</Text>
        `,
      },

      {
        code: `
<Text>
  {foo ? <Trans>foo</Trans> : <Trans>bar</Trans>}
</Text>
        `,
      },

      {
        code: `
<Trans>
  <Text>
    foo
  </Text>
</Trans>
        `,
      },

      {
        code: `
<Trans>
  {foo && <Text>foo</Text>}
</Trans>
              `,
      },

      {
        code: `
<Trans>
  {foo ? <Text>foo</Text> : <Text>bar</Text>}
</Trans>
              `,
      },

      {
        code: `
<CustomText>
  foo
</CustomText>
        `,
      },

      {
        code: `
<CustomText>
  <Trans>
    foo
  </Trans>
</CustomText>
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

      {
        code: `
<View>
  <CustomText>
    foo
  </CustomText>
</View>
        `,
      },

      {
        code: `
<View prop={
  <Text>foo</Text>
}>
  <Bar />
</View>
        `,
      },

      {
        code: `
<View prop={
  foo && <Text>foo</Text>
}>
  <Bar />
</View>
        `,
      },

      {
        code: `
<View prop={
  foo ? <Text>foo</Text> : <Text>bar</Text>
}>
  <Bar />
</View>
        `,
      },

      {
        code: `
<View prop={
  <Trans><Text>foo</Text></Trans>
}>
  <Bar />
</View>
        `,
      },

      {
        code: `
<View prop={
  <Text><Trans>foo</Trans></Text>
}>
  <Bar />
</View>
        `,
      },

      {
        code: `
<Foo propText={
  <Trans>foo</Trans>
}>
  <Bar />
</Foo>
        `,
      },

      {
        code: `
<Foo propText={
  foo && <Trans>foo</Trans>
}>
  <Bar />
</Foo>
              `,
      },

      {
        code: `
<Foo propText={
  foo ? <Trans>foo</Trans> : <Trans>bar</Trans>
}>
  <Bar />
</Foo>
              `,
      },
    ],

    invalid: [
      {
        code: `
<View> </View>
        `,
        errors: 1,
      },

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
  <>
    foo
  </>
</View>
        `,
        errors: 1,
      },

      {
        code: `
<View>
  <Trans>
    foo
  </Trans>
</View>
        `,
        errors: 1,
      },

      {
        code: `
<View>
  {foo && <Trans>foo</Trans>}
</View>
        `,
        errors: 1,
      },

      {
        code: `
<View>
  {foo ? <Trans>foo</Trans> : <Trans>bar</Trans>}
</View>
        `,
        errors: 2,
      },

      {
        code: `
<Trans>
  <View>
    foo
  </View>
</Trans>
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
        code: `
<Text>
  <View>
    foo
  </View>
</Text>
        `,
        errors: 1,
      },

      {
        code: `
<Text prop={
  <View>foo</View>
}>
  <Bar />
</Text>
        `,
        errors: 1,
      },

      {
        code: `
<Text prop={
  foo && <View>foo</View>
}>
  <Bar />
</Text>
        `,
        errors: 1,
      },

      {
        code: `
<Text prop={
  foo ? <View>foo</View> : <View>bar</View>
}>
  <Bar />
</Text>
        `,
        errors: 2,
      },

      {
        code: `
<Foo prop={
  <Trans>foo</Trans>
}>
  <Bar />
</Foo>
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
