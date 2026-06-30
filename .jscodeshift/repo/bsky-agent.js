/**
 * Codemod to replace BskyAgent with AtpAgent
 *
 * Before:
 *   import {BskyAgent} from '@atproto/api`
 *   BskyAgent.appLabelers.includes(labeler)
 *
 * After:
 *   import {AtpAgent} from '@atproto/api`
 *   AtpAgent.appLabelers.includes(labeler)
 *
 * Handles import specifiers, type annotations, static member access
 * (BskyAgent.configure), `extends BskyAgent`, and `new BskyAgent()`. Whole
 * identifiers only, so names like `OpaqueBskyAgent` are left untouched.
 *
 * Usage: jscodeshift -t .jscodeshift/repo/bsky-agent.js <file-path>
 * Example: jscodeshift -t .jscodeshift/repo/bsky-agent.js src/lib/moderation.ts
 */

/* eslint-disable */

export const parser = 'tsx'

export default function transformer(file, api) {
  const j = api.jscodeshift
  const root = j(file.source)

  // Replace every standalone `BskyAgent` identifier with `AtpAgent`. This
  // covers imports, type references, member expressions, `extends`, and `new`.
  root
    .find(j.Identifier, {name: 'BskyAgent'})
    .replaceWith(() => j.identifier('AtpAgent'))

  // Renaming can leave a duplicate `AtpAgent` specifier on the @atproto/api
  // import if the file already imported it. Dedupe by imported name, keeping
  // the type-only modifier only if every duplicate was type-only.
  root
    .find(j.ImportDeclaration, {source: {value: '@atproto/api'}})
    .forEach(path => {
      const seen = new Map()
      for (const spec of path.value.specifiers) {
        if (spec.type !== 'ImportSpecifier') {
          seen.set(Symbol(), spec)
          continue
        }
        const name = spec.imported.name
        const existing = seen.get(name)
        if (!existing) {
          seen.set(name, spec)
        } else if (
          existing.importKind === 'type' &&
          spec.importKind !== 'type'
        ) {
          // Prefer the value (non-type) import if either usage needs it.
          seen.set(name, spec)
        }
      }
      path.value.specifiers = Array.from(seen.values())
    })

  return root.toSource()
}
