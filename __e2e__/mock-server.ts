import {createServer as createHTTPServer} from 'node:http'
import {createServer, TestPDS} from '../jest/test-pds'

async function main() {
  let server: TestPDS
  createHTTPServer(async (req, res) => {
    console.log(req.method, req.url)
    if (req.method !== 'GET') {
      return res.writeHead(200).end()
    }
    try {
      console.log('Closing old server')
      await server?.close()
      console.log('Starting new server')
      server = await createServer()
      console.log('Listening at', server.pdsUrl)
      if (req.url === '/mock1') {
        console.log('Generating mock1')
        await server.mocker.generateStandardMock()
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
