import express from 'express'

import i18n from './i18n.js'
import preview from './routes/preview.js'

const app = express()
app.use(i18n.init)
preview(app)

const port = Number(process.env.LINK_PORT ?? 3000)
app.listen(port, '127.0.0.1', () => {
  console.log(
    `Link warning preview: http://localhost:${port}/_dev/link-warning`,
  )
})
