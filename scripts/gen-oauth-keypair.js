/**
 * One-off setup tool: generate the Eurosky OAuth confidential-client signing
 * keypair (ES256 / P-256).
 *
 * - PUBLIC key  -> written to src/config/oauth.public-jwks.json as
 *   { "keys": [ <pub> ] }. Not secret; commit it. Inlined into the generated
 *   oauth-client-metadata.json by gen-oauth-metadata.js.
 * - PRIVATE key -> printed to stdout ONLY, never written to disk. Put it in
 *   secret custody (vault / password manager) and later into the Cloudflare
 *   Worker via `wrangler secret put`. NEVER commit or paste it anywhere.
 *
 * Public and private share a generated `kid` so they stay paired and key
 * rotation is graceful (publish a new key alongside the old one).
 *
 * Usage:
 *   node scripts/gen-oauth-keypair.js          # refuses if key file exists
 *   node scripts/gen-oauth-keypair.js --force  # overwrite = ROTATE the key
 *
 * Overwriting an existing committed public key is a key rotation: every live
 * confidential session signed by the old key breaks. --force is required so
 * that cannot happen by accident.
 */
/* eslint-disable import-x/no-nodejs-modules -- Node setup script, not app source */
const fs = require('node:fs')
const path = require('node:path')
const {generateKeyPairSync, randomUUID} = require('node:crypto')

const projectRoot = path.join(__dirname, '..')
const outFile = path.join(
  projectRoot,
  'src',
  'config',
  'oauth.public-jwks.json',
)
const force = process.argv.includes('--force')

if (fs.existsSync(outFile) && !force) {
  console.error(
    `gen-oauth-keypair: ${outFile} already exists.\n` +
      `Refusing to overwrite - that would ROTATE the key and break every\n` +
      `live confidential session. Re-run with --force only if you intend to.`,
  )
  process.exit(1)
}

const {publicKey, privateKey} = generateKeyPairSync('ec', {
  namedCurve: 'P-256',
})
const kid = randomUUID()
const pub = publicKey.export({format: 'jwk'})
const priv = privateKey.export({format: 'jwk'})
for (const k of [pub, priv]) {
  k.kid = kid
  k.alg = 'ES256'
  k.use = 'sig'
}

fs.writeFileSync(outFile, JSON.stringify({keys: [pub]}, null, 2) + '\n')

console.log('')
console.log(`PUBLIC key written -> ${path.relative(projectRoot, outFile)}`)
console.log('  (not secret - commit this file)')
console.log('')
console.log('================================================================')
console.log('PRIVATE JWK - SECRET. Copy into your vault now, then later into')
console.log('the Cloudflare Worker via `wrangler secret put`. Do NOT commit')
console.log('it, do NOT paste it into chat. It is not saved to disk.')
console.log('================================================================')
console.log(JSON.stringify(priv))
console.log('================================================================')
console.log(`kid: ${kid}`)
console.log('')
