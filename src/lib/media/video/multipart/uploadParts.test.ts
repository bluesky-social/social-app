import {type ChunkReader, type UploadPartFn} from './types'
import {uploadParts} from './uploadParts'

function fakeReader(): ChunkReader {
  return {
    read: (_offset, size) => Promise.resolve(new Uint8Array(size)),
    close: () => {},
  }
}

const parts = [
  {partNumber: 1, offset: 0, size: 10},
  {partNumber: 2, offset: 10, size: 10},
  {partNumber: 3, offset: 20, size: 5},
]

describe('uploadParts', () => {
  it('uploads every part and returns results ordered by part number', async () => {
    const uploadPart: UploadPartFn = ({part}) =>
      Promise.resolve({
        partNumber: part.partNumber,
        sizeBytes: part.size,
      })

    const results = await uploadParts({
      parts,
      reader: fakeReader(),
      uploadPart,
      totalBytes: 25,
      setProgress: () => {},
      signal: new AbortController().signal,
    })

    expect(results.map(r => r.partNumber)).toEqual([1, 2, 3])
    expect(results.map(r => r.sizeBytes)).toEqual([10, 10, 5])
  })

  it('respects the concurrency cap', async () => {
    let active = 0
    let maxActive = 0
    const uploadPart: UploadPartFn = async ({part}) => {
      active++
      maxActive = Math.max(maxActive, active)
      await new Promise(r => setTimeout(r, 5))
      active--
      return {partNumber: part.partNumber, sizeBytes: part.size}
    }

    await uploadParts({
      parts,
      reader: fakeReader(),
      uploadPart,
      totalBytes: 25,
      setProgress: () => {},
      signal: new AbortController().signal,
      concurrency: 2,
    })

    expect(maxActive).toBeLessThanOrEqual(2)
  })

  it('retries a failing part and succeeds', async () => {
    const attemptsByPart = new Map<number, number>()
    const uploadPart: UploadPartFn = ({part}) => {
      const n = (attemptsByPart.get(part.partNumber) ?? 0) + 1
      attemptsByPart.set(part.partNumber, n)
      if (part.partNumber === 2 && n === 1) {
        return Promise.reject(new Error('transient'))
      }
      return Promise.resolve({
        partNumber: part.partNumber,
        sizeBytes: part.size,
      })
    }

    const results = await uploadParts({
      parts,
      reader: fakeReader(),
      uploadPart,
      totalBytes: 25,
      setProgress: () => {},
      signal: new AbortController().signal,
    })

    expect(attemptsByPart.get(2)).toBe(2)
    expect(results).toHaveLength(3)
  })

  it('throws after exhausting attempts', async () => {
    const uploadPart: UploadPartFn = () =>
      Promise.reject(new Error('always fails'))

    await expect(
      uploadParts({
        parts,
        reader: fakeReader(),
        uploadPart,
        totalBytes: 25,
        setProgress: () => {},
        signal: new AbortController().signal,
        maxAttempts: 2,
      }),
    ).rejects.toThrow('always fails')
  })

  it('reports progress that reaches 1 when all parts complete', async () => {
    const progress: number[] = []
    const uploadPart: UploadPartFn = ({part, chunk, onProgress}) => {
      onProgress(chunk.byteLength)
      return Promise.resolve({
        partNumber: part.partNumber,
        sizeBytes: part.size,
      })
    }

    await uploadParts({
      parts,
      reader: fakeReader(),
      uploadPart,
      totalBytes: 25,
      setProgress: p => progress.push(p),
      signal: new AbortController().signal,
      concurrency: 1,
    })

    expect(progress[progress.length - 1]).toBe(1)
  })
})
