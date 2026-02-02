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

import {createPersistedQueryStorage} from '../persisted-query-storage'

describe('createPersistedQueryStorage', () => {
  it('should create isolated storage instances', async () => {
    const storage1 = createPersistedQueryStorage('store1')
    const storage2 = createPersistedQueryStorage('store2')

    await storage1.setItem('key', 'value1')
    await storage2.setItem('key', 'value2')

    expect(await storage1.getItem('key')).toBe('value1')
    expect(await storage2.getItem('key')).toBe('value2')
  })

  describe('storage operations', () => {
    let storage: ReturnType<typeof createPersistedQueryStorage>

    beforeEach(() => {
      storage = createPersistedQueryStorage('test_store')
    })

    it('should return null for non-existent keys', async () => {
      const result = await storage.getItem('non-existent-key')
      expect(result).toBeNull()
    })

    it('should store and retrieve a value', async () => {
      const testValue = JSON.stringify({data: 'test'})
      await storage.setItem('test-key', testValue)
      const result = await storage.getItem('test-key')
      expect(result).toBe(testValue)
    })

    it('should remove a value', async () => {
      const testValue = JSON.stringify({data: 'test'})
      await storage.setItem('test-key', testValue)
      await storage.removeItem('test-key')
      const result = await storage.getItem('test-key')
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
      await storage.setItem('complex-key', complexData)
      const result = await storage.getItem('complex-key')
      expect(result).toBe(complexData)
      expect(JSON.parse(result!)).toEqual(JSON.parse(complexData))
    })

    it('should overwrite existing values', async () => {
      await storage.setItem('test-key', 'value1')
      await storage.setItem('test-key', 'value2')
      const result = await storage.getItem('test-key')
      expect(result).toBe('value2')
    })
  })
})
