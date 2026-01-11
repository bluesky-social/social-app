import {beforeEach, describe, expect, it, jest} from '@jest/globals'

jest.mock('@bsky.app/react-native-mmkv', () => ({
  MMKV: class MMKVMock {
    _store = new Map<string, string>()

    getString(key: string) {
      return this._store.get(key)
    }

    set(key: string, value: string) {
      this._store.set(key, value)
    }

    delete(key: string) {
      this._store.delete(key)
    }

    clearAll() {
      this._store.clear()
    }
  },
}))

import {persistedQueryStorage} from '../persisted-query-storage'

describe('persistedQueryStorage', () => {
  beforeEach(async () => {
    // Clear storage between tests
    await persistedQueryStorage.removeItem('test-key')
  })

  it('should return null for non-existent keys', async () => {
    const result = await persistedQueryStorage.getItem('non-existent-key')
    expect(result).toBeNull()
  })

  it('should store and retrieve a value', async () => {
    const testValue = JSON.stringify({data: 'test'})
    await persistedQueryStorage.setItem('test-key', testValue)
    const result = await persistedQueryStorage.getItem('test-key')
    expect(result).toBe(testValue)
  })

  it('should remove a value', async () => {
    const testValue = JSON.stringify({data: 'test'})
    await persistedQueryStorage.setItem('test-key', testValue)
    await persistedQueryStorage.removeItem('test-key')
    const result = await persistedQueryStorage.getItem('test-key')
    expect(result).toBeNull()
  })

  it('should handle complex JSON data', async () => {
    const complexData = JSON.stringify({
      queries: [
        {key: 'query1', data: {nested: {value: 123}}},
        {key: 'query2', data: {array: [1, 2, 3]}},
      ],
      timestamp: Date.now(),
    })
    await persistedQueryStorage.setItem('complex-key', complexData)
    const result = await persistedQueryStorage.getItem('complex-key')
    expect(result).toBe(complexData)
    expect(JSON.parse(result!)).toEqual(JSON.parse(complexData))
  })

  it('should overwrite existing values', async () => {
    await persistedQueryStorage.setItem('test-key', 'value1')
    await persistedQueryStorage.setItem('test-key', 'value2')
    const result = await persistedQueryStorage.getItem('test-key')
    expect(result).toBe('value2')
  })
})
