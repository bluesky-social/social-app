import {IpldStore} from '@adx/common'
import server from '@adx/server/dist/server.js'
import Database from '@adx/server/dist/db/index.js'

const PORT = 1986

async function start() {
  console.log('Initializing...')

  const db = Database.memory()
  const serverBlockstore = IpldStore.createInMemory()
  await db.dropTables()
  await db.createTables()
  server(serverBlockstore, db, PORT)
}
start()
