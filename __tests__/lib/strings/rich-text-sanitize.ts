import {AppBskyFeedPost} from '@atproto/api'
type Entity = AppBskyFeedPost.Entity
import {RichText} from '../../../src/lib/strings/rich-text'
import {removeExcessNewlines} from '../../../src/lib/strings/rich-text-sanitize'

describe('removeExcessNewlines', () => {
  it('removes more than two consecutive new lines', () => {
    const input = new RichText(
      'test\n\n\n\n\ntest\n\n\n\n\n\n\ntest\n\n\n\n\n\n\ntest\n\n\n\n\n\n\ntest',
    )
    const output = removeExcessNewlines(input)
    expect(output.text).toEqual('test\n\ntest\n\ntest\n\ntest\n\ntest')
  })

  it('removes more than two consecutive new lines with spaces', () => {
    const input = new RichText(
      'test\n\n\n\n\ntest\n \n \n \n \n\n\ntest\n\n\n\n\n\n\ntest\n\n\n\n\n  \n\ntest',
    )
    const output = removeExcessNewlines(input)
    expect(output.text).toEqual('test\n\ntest\n\ntest\n\ntest\n\ntest')
  })

  it('returns original string if there are no consecutive new lines', () => {
    const input = new RichText('test\n\ntest\n\ntest\n\ntest\n\ntest')
    const output = removeExcessNewlines(input)
    expect(output.text).toEqual(input.text)
  })

  it('returns original string if there are no new lines', () => {
    const input = new RichText('test test          test test test')
    const output = removeExcessNewlines(input)
    expect(output.text).toEqual(input.text)
  })

  it('returns empty string if input is empty', () => {
    const input = new RichText('')
    const output = removeExcessNewlines(input)
    expect(output.text).toEqual('')
  })

  it('works with different types of new line characters', () => {
    const input = new RichText(
      'test\r\ntest\n\rtest\rtest\n\n\n\ntest\n\r \n \n \n \n\n\ntest',
    )
    const output = removeExcessNewlines(input)
    expect(output.text).toEqual('test\r\ntest\n\rtest\rtest\n\ntest\n\ntest')
  })

  it('removes more than two consecutive new lines with zero width space', () => {
    const input = new RichText(
      'test\n\n\n\n\ntest\n\u200B\u200B\n\n\n\ntest\n \u200B\u200B \n\n\n\ntest\n\n\n\n\n\n\ntest',
    )
    const output = removeExcessNewlines(input)
    expect(output.text).toEqual('test\n\ntest\n\ntest\n\ntest\n\ntest')
  })

  it('removes more than two consecutive new lines with zero width non-joiner', () => {
    const input = new RichText(
      'test\n\n\n\n\ntest\n\u200C\u200C\n\n\n\ntest\n \u200C\u200C \n\n\n\ntest\n\n\n\n\n\n\ntest',
    )
    const output = removeExcessNewlines(input)
    expect(output.text).toEqual('test\n\ntest\n\ntest\n\ntest\n\ntest')
  })

  it('removes more than two consecutive new lines with zero width joiner', () => {
    const input = new RichText(
      'test\n\n\n\n\ntest\n\u200D\u200D\n\n\n\ntest\n \u200D\u200D \n\n\n\ntest\n\n\n\n\n\n\ntest',
    )
    const output = removeExcessNewlines(input)
    expect(output.text).toEqual('test\n\ntest\n\ntest\n\ntest\n\ntest')
  })

  it('removes more than two consecutive new lines with soft hyphen', () => {
    const input = new RichText(
      'test\n\n\n\n\ntest\n\u00AD\u00AD\n\n\n\ntest\n \u00AD\u00AD \n\n\n\ntest\n\n\n\n\n\n\ntest',
    )
    const output = removeExcessNewlines(input)
    expect(output.text).toEqual('test\n\ntest\n\ntest\n\ntest\n\ntest')
  })

  it('removes more than two consecutive new lines with word joiner', () => {
    const input = new RichText(
      'test\n\n\n\n\ntest\n\u2060\u2060\n\n\n\ntest\n \u2060\u2060 \n\n\n\ntest\n\n\n\n\n\n\ntest',
    )
    const output = removeExcessNewlines(input)
    expect(output.text).toEqual('test\n\ntest\n\ntest\n\ntest\n\ntest')
  })
})

describe('removeExcessNewlines w/entities', () => {
  it('preserves entities as expected', () => {
    const input = new RichText(
      'test\n\n\n\n\ntest\n\n\n\n\n\n\ntest\n\n\n\n\n\n\ntest\n\n\n\n\n\n\ntest',
      [
        {index: {start: 0, end: 13}, type: '', value: ''},
        {index: {start: 13, end: 24}, type: '', value: ''},
        {index: {start: 9, end: 15}, type: '', value: ''},
        {index: {start: 4, end: 9}, type: '', value: ''},
      ],
    )
    const output = removeExcessNewlines(input)
    expect(entToStr(input.text, input.entities?.[0])).toEqual(
      'test\n\n\n\n\ntest',
    )
    expect(entToStr(input.text, input.entities?.[1])).toEqual(
      '\n\n\n\n\n\n\ntest',
    )
    expect(entToStr(input.text, input.entities?.[2])).toEqual('test\n\n')
    expect(entToStr(input.text, input.entities?.[3])).toEqual('\n\n\n\n\n')
    expect(output.text).toEqual('test\n\ntest\n\ntest\n\ntest\n\ntest')
    expect(entToStr(output.text, output.entities?.[0])).toEqual('test\n\ntest')
    expect(entToStr(output.text, output.entities?.[1])).toEqual('test')
    expect(entToStr(output.text, output.entities?.[2])).toEqual('test')
    expect(output.entities?.[3]).toEqual(undefined)
  })
})

function entToStr(str: string, ent?: Entity) {
  if (!ent) {
    return ''
  }
  return str.slice(ent.index.start, ent.index.end)
}
