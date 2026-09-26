import {mkdir, writeFile} from 'node:fs/promises'
import {createServer} from 'node:http'
import {fileURLToPath} from 'node:url'

const output = new URL('../results/', import.meta.url)
await mkdir(output, {recursive: true})
createServer((request, response) => {
  void collect(request, response)
}).listen(8124, '127.0.0.1', () => {
  console.log('Benchmark collector listening on http://127.0.0.1:8124')
})

/**
 * @param {import('node:http').IncomingMessage} request
 * @param {import('node:http').ServerResponse} response
 */
async function collect(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*')
  if (request.method !== 'POST' || request.url !== '/results') {
    response.end('Fast Text benchmark collector')
    return
  }
  try {
    const chunks = []
    for await (const chunk of request) chunks.push(chunk)
    /** @type {unknown} */
    const result = JSON.parse(Buffer.concat(chunks).toString())
    const name = `${new Date().toISOString().replaceAll(':', '-')}.json`
    await writeFile(
      new URL(name, output),
      JSON.stringify(result, null, 2) + '\n',
    )
    console.log(`Saved ${fileURLToPath(new URL(name, output))}`)
    response.end(name)
  } catch (error) {
    response.statusCode = 400
    response.end(String(error))
  }
}
