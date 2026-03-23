import path from 'node:path'
import {fileURLToPath} from 'node:url'

import i18n from 'i18n'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

i18n.configure({
  locales: ['en', 'es', 'fr'],
  defaultLocale: 'en',
  directory: path.join(__dirname, '../locales'),
})

export default i18n
