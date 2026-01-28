const {RuleTester} = require('eslint')
const tseslint = require('typescript-eslint')
const linguiMsgRule = require('../lingui-msg-rule')

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
})

describe('lingui-msg-rule', () => {
  const tests = {
    valid: [
      // msg template literal
      {
        code: `
const {_} = useLingui()
const x = _(msg\`Hello\`)
        `,
      },
      // msg template literal with interpolation
      {
        code: `
const {_} = useLingui()
const name = 'World'
const x = _(msg\`Hello \${name}\`)
        `,
      },
      // plural macro
      {
        code: `
const {_} = useLingui()
const count = 5
const x = _(plural(count, {one: '# item', other: '# items'}))
        `,
      },
      // select macro
      {
        code: `
const {_} = useLingui()
const gender = 'female'
const x = _(select(gender, {male: 'He', female: 'She', other: 'They'}))
        `,
      },
      // selectOrdinal macro
      {
        code: `
const {_} = useLingui()
const position = 1
const x = _(selectOrdinal(position, {one: '#st', two: '#nd', few: '#rd', other: '#th'}))
        `,
      },
      // Different function named _ (not from useLingui context, but rule doesn't track that)
      // This is fine - the rule just checks the pattern
      {
        code: `
const _ = (x) => x
const x = _(someValue)
        `,
      },
    ],
    invalid: [
      // Plain string literal (single quotes)
      {
        code: `
const {_} = useLingui()
const x = _('Bad')
        `,
        errors: [{messageId: 'missingMsg'}],
      },
      // Plain string literal (double quotes)
      {
        code: `
const {_} = useLingui()
const x = _("Bad")
        `,
        errors: [{messageId: 'missingMsg'}],
      },
      // Template literal without msg tag
      {
        code: `
const {_} = useLingui()
const x = _(\`Bad\`)
        `,
        errors: [{messageId: 'missingMsg'}],
      },
      // Variable/identifier
      {
        code: `
const {_} = useLingui()
const message = 'Hello'
const x = _(message)
        `,
        errors: [{messageId: 'missingMsg'}],
      },
      // Arbitrary function call
      {
        code: `
const {_} = useLingui()
const x = _(getMessage())
        `,
        errors: [{messageId: 'missingMsg'}],
      },
      // Empty call
      {
        code: `
const {_} = useLingui()
const x = _()
        `,
        errors: [{messageId: 'missingMsg'}],
      },
      // Tagged template with wrong tag
      {
        code: `
const {_} = useLingui()
const x = _(html\`Hello\`)
        `,
        errors: [{messageId: 'missingMsg'}],
      },
      // Number literal
      {
        code: `
const {_} = useLingui()
const x = _(123)
        `,
        errors: [{messageId: 'missingMsg'}],
      },
    ],
  }

  ruleTester.run('lingui-msg-rule', linguiMsgRule, tests)
})
