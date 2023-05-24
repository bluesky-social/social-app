import en_auth from './en/auth.json'
import en_common from './en/common.json'
import en_glossary from './en/glossary.json'

const resources = {
  en: {auth: en_auth, common: en_common, glossary: en_glossary},
} as const

export default resources
