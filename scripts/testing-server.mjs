import {IpldStore} from '@adxp/common'
import PDSServer from '@adxp/server/dist/server.js'
import PDSDatabase from '@adxp/server/dist/db/index.js'
import WSRelayServer from '@adxp/ws-relay/dist/index.js'

const PDS_PORT = 2583
const WSR_PORT = 3005

async function start() {
  console.log('Initializing...')

  const db = PDSDatabase.memory()
  const serverBlockstore = IpldStore.createInMemory()
  await db.dropTables()
  await db.createTables()
  PDSServer(serverBlockstore, db, PDS_PORT)

  if (process.argv.includes('--relay')) {
    WSRelayServer(WSR_PORT)
    console.log(`🔁 Relay server running on port ${WSR_PORT}`)
  } else {
    console.log('Include --relay to start the WS Relay')
  }
}
start()
