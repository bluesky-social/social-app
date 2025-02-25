const MAX_FLAGS = 300
const FLAGS_PER_CHAR = 6

export function pack(flags: Record<string, boolean>) {
  const values = Object.values(flags)
  if (values.length > MAX_FLAGS) {
    throw new Error(`Too many flags. Maximum supported is ${MAX_FLAGS}`)
  }
  const compacted = values.map(value => value ? '1' : '0').join('')
  // split into chunks of 6 values
  const encoded = (compacted.match(/.{1,6}/g) || [])
    .map(chunk => String.fromCharCode(parseInt(chunk.padEnd(6, '0'), 2)))
    .join('')
  return encoded
}

export function unpack<K extends string>(encoded: string, keys: K[]) {
  const binary = encoded.split('')
    .map(char => char.charCodeAt(0).toString(2).padEnd(6, '0'))
    .join('')
  return keys.reduce((obj, key, i) => {
    obj[key] = binary[i] === '1'
    return obj
  }, {} as Record<K, boolean>)
}

