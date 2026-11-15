'use strict'

/**
 * @type {import('eslint').Rule.RuleModule}
 */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce that Lingui _() function is called with msg`` template literal or plural/select macros',
      recommended: true,
    },
    fixable: 'code',
    messages: {
      missingMsg:
        'Lingui _() must be called with msg`...` or msg({...}) or plural/select/selectOrdinal. Example: _(msg`Hello`)',
    },
    schema: [],
  },

  create(context) {
    // Valid Lingui macro functions that can be passed to _()
    const VALID_MACRO_FUNCTIONS = new Set([
      'msg',
      'plural',
      'select',
      'selectOrdinal',
    ])

    /**
     * Escape backticks and backslashes for template literal
     */
    function escapeForTemplateLiteral(str) {
      return str.replace(/\\`/g, '`').replace(/`/g, '\\`')
    }

    /**
     * Try to get a fixer for the given argument
     * Returns null if we can't safely fix it
     */
    function getFixer(firstArg) {
      const sourceCode = context.sourceCode ?? context.getSourceCode()

      // Fix string literals: _('foo') -> _(msg`foo`)
      if (firstArg.type === 'Literal' && typeof firstArg.value === 'string') {
        const escaped = escapeForTemplateLiteral(firstArg.value)
        return function (fixer) {
          return fixer.replaceText(firstArg, 'msg`' + escaped + '`')
        }
      }

      // Fix untagged template literals: _(`foo`) -> _(msg`foo`)
      if (firstArg.type === 'TemplateLiteral') {
        const text = sourceCode.getText(firstArg)
        return function (fixer) {
          return fixer.replaceText(firstArg, 'msg' + text)
        }
      }

      return null
    }

    return {
      CallExpression(node) {
        // Check if this is a call to _()
        if (node.callee.type !== 'Identifier' || node.callee.name !== '_') {
          return
        }

        // Must have at least one argument
        if (node.arguments.length === 0) {
          context.report({
            node,
            messageId: 'missingMsg',
          })
          return
        }

        const firstArg = node.arguments[0]

        // Valid: _(msg`...`)
        if (
          firstArg.type === 'TaggedTemplateExpression' &&
          firstArg.tag.type === 'Identifier' &&
          firstArg.tag.name === 'msg'
        ) {
          return
        }

        // Valid: _(msg(...)), _(plural(...)), _(select(...)), _(selectOrdinal(...))
        if (
          firstArg.type === 'CallExpression' &&
          firstArg.callee.type === 'Identifier' &&
          VALID_MACRO_FUNCTIONS.has(firstArg.callee.name)
        ) {
          return
        }

        // Everything else is invalid
        const fix = getFixer(firstArg)
        context.report({
          node,
          messageId: 'missingMsg',
          fix,
        })
      },
    }
  },
}
