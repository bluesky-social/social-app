import {IpldStore} from '@adxp/common'
import PDSServer from '@adxp/server/dist/server.js'
import PDSDatabase from '@adxp/server/dist/db/index.js'
import WSRelayServer from '@adxp/ws-relay/dist/index.js'
import AuthLobbyServer from '@adxp/auth-lobby'

const PDS_PORT = 2583
const AUTH_LOBBY1_PORT = 3001
const AUTH_LOBBY2_PORT = 3002
const WSR_PORT = 3005

async function start() {
  console.log('Initializing...')

  const db = PDSDatabase.memory()
  const serverBlockstore = IpldStore.createInMemory()
  await db.dropTables()
  await db.createTables()
  PDSServer(serverBlockstore, db, PDS_PORT)

  init(AuthLobbyServer, AUTH_LOBBY1_PORT, 'Auth lobby')

  if (process.argv.includes('--relay')) {
    init(AuthLobbyServer, AUTH_LOBBY2_PORT, 'Auth lobby 2')
    init(WSRelayServer, WSR_PORT, 'Relay server')
  } else {
    console.log('Include --relay to start the WS Relay and second auth lobby')
  }
}
start()

function init(fn, port, name) {
  const s = fn(port)
  s.on('listening', () => console.log(`✔ ${name} running on port ${port}`))
  s.on('error', e => console.log(`${name} failed to start:`, e))
}
