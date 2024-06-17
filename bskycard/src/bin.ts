import {CardService, envToCfg, httpLogger, readEnv} from './index.js'

async function main() {
  const env = readEnv()
  const cfg = envToCfg(env)
  const card = await CardService.create(cfg)
  await card.start()
  httpLogger.info('card service is running')
  process.on('SIGTERM', async () => {
    httpLogger.info('card service is stopping')
    await card.destroy()
    httpLogger.info('card service is stopped')
  })
}

main()
