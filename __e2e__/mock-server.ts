import {createServer as createHTTPServer} from 'node:http'
import {parse} from 'node:url'
import {createServer, TestPDS} from '../jest/test-pds'

async function main() {
  let server: TestPDS
  createHTTPServer(async (req, res) => {
    const url = parse(req.url || '/', true)
    if (req.method !== 'POST') {
      return res.writeHead(200).end()
    }
    try {
      console.log('Closing old server')
      await server?.close()
      console.log('Starting new server')
      server = await createServer()
      console.log('Listening at', server.pdsUrl)
      if (url?.query) {
        if ('users' in url.query) {
          console.log('Generating mock users')
          await server.mocker.createUser('alice')
          await server.mocker.createUser('bob')
          await server.mocker.createUser('carla')
          await server.mocker.users.alice.agent.upsertProfile(() => ({
            displayName: 'Alice',
            description: 'Test user 1',
          }))
          await server.mocker.users.bob.agent.upsertProfile(() => ({
            displayName: 'Bob',
            description: 'Test user 2',
          }))
          await server.mocker.users.carla.agent.upsertProfile(() => ({
            displayName: 'Carla',
            description: 'Test user 3',
          }))
        }
        if ('follows' in url.query) {
          console.log('Generating mock follows')
          await server.mocker.follow('alice', 'bob')
          await server.mocker.follow('alice', 'carla')
          await server.mocker.follow('bob', 'alice')
          await server.mocker.follow('bob', 'carla')
          await server.mocker.follow('carla', 'alice')
          await server.mocker.follow('carla', 'bob')
        }
        if ('posts' in url.query) {
          console.log('Generating mock posts')
          for (let user in server.mocker.users) {
            await server.mocker.users[user].agent.post({text: 'Post'})
          }
        }
        if ('thread' in url.query) {
          console.log('Generating mock posts')
          const res = await server.mocker.users.bob.agent.post({
            text: 'Thread root',
          })
          await server.mocker.users.carla.agent.post({
            text: 'Thread reply',
            reply: {
              parent: {cid: res.cid, uri: res.uri},
              root: {cid: res.cid, uri: res.uri},
            },
          })
        }
      }
      console.log('Ready')
      return res.writeHead(200).end(server.pdsUrl)
    } catch (e) {
      console.error('Error!', e)
      return res.writeHead(500).end()
    }
  }).listen(1986)
  console.log('Mock server manager listening on 1986')
}
main()
