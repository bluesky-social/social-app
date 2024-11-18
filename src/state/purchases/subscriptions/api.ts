import {create} from 'gretchen'

export const api = create({
  baseURL: process.env.PLUS_SERVICE_URL,
})
