import {beforeEach, expect, test} from '@jest/globals'

import {Storage} from '#/storage'

type Schema = {
  boo: boolean
  str: string | null
  num: number
  obj: Record<string, unknown>
}

const store = new Storage<[], Schema>()

beforeEach(() => {
  store.removeMany([], ['boo', 'str', 'num', 'obj'])
})

test(`stores and retrieves data`, async () => {
  await store.set(['boo'], true)
  await store.set(['str'], 'string')
  await store.set(['num'], 1)
  expect(await store.get(['boo'])).toEqual(true)
  expect(await store.get(['str'])).toEqual('string')
  expect(await store.get(['num'])).toEqual(1)
})

test(`removes data`, async () => {
  await store.set(['boo'], true)
  expect(await store.get(['boo'])).toEqual(true)
  await store.remove(['boo'])
  expect(await store.get(['boo'])).toEqual(undefined)
})

test(`removes multiple keys at once`, async () => {
  await store.set(['boo'], true)
  await store.set(['str'], 'string')
  await store.set(['num'], 1)
  await store.removeMany([], ['boo', 'str', 'num'])
  expect(await store.get(['boo'])).toEqual(undefined)
  expect(await store.get(['str'])).toEqual(undefined)
  expect(await store.get(['num'])).toEqual(undefined)
})

test(`concatenates keys`, async () => {
  await store.remove(['str'])
  await store.set(['str'], 'concat')
  // @ts-ignore accessing these properties for testing purposes only
  expect(await store.store.getItem(`str`)).toBeTruthy()
})

test(`can store falsy values`, async () => {
  await store.set(['str'], null)
  await store.set(['num'], 0)
  expect(await store.get(['str'])).toEqual(null)
  expect(await store.get(['num'])).toEqual(0)
})

test(`can store objects`, async () => {
  const obj = {foo: true}
  await store.set(['obj'], obj)
  expect(await store.get(['obj'])).toEqual(obj)
})
