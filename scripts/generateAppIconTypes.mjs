// Generates the `IconName` union for `@mozzius/expo-dynamic-app-icon` from the
// keys passed to its config plugin in `app.config.js`. The plugin itself does
// this rewrite, but only when Expo applies config plugins (prebuild/export),
// not when CI runs `expo config` / `@expo/fingerprint` / typecheck. Running it
// from `postinstall` makes the type stable in every environment.
//
// Source of truth: the plugin entry in `app.config.js`. No hand-maintained
// list.

import {createRequire} from 'node:module'
import {writeFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import path from 'node:path'

const require = createRequire(import.meta.url)
const repoRoot = fileURLToPath(new URL('..', import.meta.url))

const PLUGIN_NAME = '@mozzius/expo-dynamic-app-icon'

const appConfig = require(path.join(repoRoot, 'app.config.js'))({})
const plugins = appConfig?.expo?.plugins ?? []

const entry = plugins.find(
  p =>
    Array.isArray(p) &&
    p[0] === PLUGIN_NAME &&
    p[1] &&
    typeof p[1] === 'object',
)
if (!entry) {
  console.error(
    `[generateAppIconTypes] Could not find ${PLUGIN_NAME} plugin entry in app.config.js. Skipping.`,
  )
  process.exit(0)
}

const iconNames = Object.keys(entry[1])
if (iconNames.length === 0) {
  console.error(
    `[generateAppIconTypes] ${PLUGIN_NAME} plugin entry has no icons. Skipping.`,
  )
  process.exit(0)
}

let typesPath
try {
  typesPath = require.resolve(`${PLUGIN_NAME}/build/types.d.ts`, {
    paths: [repoRoot],
  })
} catch {
  // Package not installed yet (e.g. install was aborted). Nothing to do.
  process.exit(0)
}

const union = iconNames.map(name => `"${name}"`).join(' | ')
const contents = `export interface DynamicAppIconRegistry {
    IconName: ${union}
}
//# sourceMappingURL=types.d.ts.map
`

writeFileSync(typesPath, contents)
console.log(
  `[generateAppIconTypes] Wrote ${iconNames.length} icon names to ${path.relative(repoRoot, typesPath)}`,
)
