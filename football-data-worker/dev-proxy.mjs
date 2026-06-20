/**
 * Local dev proxy for the live sports widget (football-data.org).
 *
 * The browser cannot call api.football-data.org directly: it sends no CORS
 * headers, so a web build's fetch is blocked. This zero-dependency proxy stands
 * in front of it - it injects the X-Auth-Token header server-side (so no token
 * ships in the web bundle) and adds permissive CORS headers. It mirrors what
 * the production Bunny edge script (bunny/index.ts) does.
 *
 * Usage:
 *   FOOTBALLDATA_TOKEN=<token> node football-data-worker/dev-proxy.mjs
 *
 * Then point the app at it:
 *   EXPO_PUBLIC_FOOTBALLDATA_API_URL=http://localhost:8787/v4
 *   EXPO_PUBLIC_FOOTBALLDATA_TOKEN=        (leave empty - proxy holds the token)
 */
import http from 'node:http'

const PORT = Number(process.env.PORT || 8787)
const UPSTREAM = 'https://api.football-data.org'
const TOKEN = process.env.FOOTBALLDATA_TOKEN || ''

if (!TOKEN) {
  console.error('Missing FOOTBALLDATA_TOKEN env var')
  process.exit(1)
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Accept, Content-Type, X-Auth-Token',
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS)
    res.end()
    return
  }

  try {
    const incoming = new URL(req.url, `http://localhost:${PORT}`)
    const target = new URL(UPSTREAM + incoming.pathname)
    incoming.searchParams.forEach((v, k) => target.searchParams.set(k, v))

    const upstream = await fetch(target.toString(), {
      headers: {Accept: 'application/json', 'X-Auth-Token': TOKEN},
    })
    const body = await upstream.text()
    res.writeHead(upstream.status, {...CORS, 'Content-Type': 'application/json'})
    res.end(body)
  } catch (err) {
    res.writeHead(502, {...CORS, 'Content-Type': 'application/json'})
    res.end(JSON.stringify({error: String(err)}))
  }
})

server.listen(PORT, () => {
  console.log(`football-data dev proxy on http://localhost:${PORT}`)
})
