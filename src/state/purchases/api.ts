import {create} from 'gretchen'

import {PLUS_SERVICE_URL} from '#/env'

export const api = create({
  baseURL: PLUS_SERVICE_URL,
})
