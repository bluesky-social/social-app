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
      // msg function call with object (descriptor form)
      {
        code: `
const {_} = useLingui()
const x = _(msg({message: 'Hello'}))
        `,
      },
      // msg function call with object and context
      {
        code: `
const {_} = useLingui()
const x = _(msg({message: 'Hello', context: 'greeting'}))
        `,
      },
    ],
    invalid: [
      // Plain string literal (single quotes) - with auto-fix
      {
        code: `
const {_} = useLingui()
const x = _('Bad')
        `,
        output: `
const {_} = useLingui()
const x = _(msg\`Bad\`)
        `,
        errors: [{messageId: 'missingMsg'}],
      },
      // Plain string literal (double quotes) - with auto-fix
      {
        code: `
const {_} = useLingui()
const x = _("Bad")
        `,
        output: `
const {_} = useLingui()
const x = _(msg\`Bad\`)
        `,
        errors: [{messageId: 'missingMsg'}],
      },
      // Template literal without msg tag - with auto-fix
      {
        code: `
const {_} = useLingui()
const x = _(\`Bad\`)
        `,
        output: `
const {_} = useLingui()
const x = _(msg\`Bad\`)
        `,
        errors: [{messageId: 'missingMsg'}],
      },
      // Template literal with interpolation - with auto-fix
      {
        code: `
const {_} = useLingui()
const name = 'World'
const x = _(\`Hello \${name}\`)
        `,
        output: `
const {_} = useLingui()
const name = 'World'
const x = _(msg\`Hello \${name}\`)
        `,
        errors: [{messageId: 'missingMsg'}],
      },
      // String with backticks that need escaping
      {
        code: `
const {_} = useLingui()
const x = _('Use \\\`code\\\` here')
        `,
        output: `
const {_} = useLingui()
const x = _(msg\`Use \\\`code\\\` here\`)
        `,
        errors: [{messageId: 'missingMsg'}],
      },
      // Variable/identifier - no auto-fix possible
      {
        code: `
const {_} = useLingui()
const message = 'Hello'
const x = _(message)
        `,
        output: null,
        errors: [{messageId: 'missingMsg'}],
      },
      // Arbitrary function call - no auto-fix possible
      {
        code: `
const {_} = useLingui()
const x = _(getMessage())
        `,
        output: null,
        errors: [{messageId: 'missingMsg'}],
      },
      // Empty call - no auto-fix possible
      {
        code: `
const {_} = useLingui()
const x = _()
        `,
        output: null,
        errors: [{messageId: 'missingMsg'}],
      },
      // Tagged template with wrong tag - no auto-fix (would need to replace tag)
      {
        code: `
const {_} = useLingui()
const x = _(html\`Hello\`)
        `,
        output: null,
        errors: [{messageId: 'missingMsg'}],
      },
      // Number literal - no auto-fix possible
      {
        code: `
const {_} = useLingui()
const x = _(123)
        `,
        output: null,
        errors: [{messageId: 'missingMsg'}],
      },
    ],
  }

  ruleTester.run('lingui-msg-rule', linguiMsgRule, tests)
})
