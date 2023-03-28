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
          await server.mocker.generateStandardGraph()
        }
        if ('posts' in url.query) {
          console.log('Generating mock posts')
          for (let user in server.mocker.users) {
            for (let i = 1; i <= 5; i++) {
              await server.mocker.users[user].agent.post({text: `Post ${i}`})
            }
          }
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
