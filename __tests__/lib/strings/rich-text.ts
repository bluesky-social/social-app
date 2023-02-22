import {RichText} from '../../../src/lib/strings/rich-text'

describe('richText.insert', () => {
  const input = new RichText('hello world', [
    {index: {start: 2, end: 7}, type: '', value: ''},
  ])

  it('correctly adjusts entities (scenario A - before)', () => {
    const output = input.clone().insert(0, 'test')
    expect(output.text).toEqual('testhello world')
    expect(output.entities?.[0].index.start).toEqual(6)
    expect(output.entities?.[0].index.end).toEqual(11)
    expect(
      output.text.slice(
        output.entities?.[0].index.start,
        output.entities?.[0].index.end,
      ),
    ).toEqual('llo w')
  })

  it('correctly adjusts entities (scenario B - inner)', () => {
    const output = input.clone().insert(4, 'test')
    expect(output.text).toEqual('helltesto world')
    expect(output.entities?.[0].index.start).toEqual(2)
    expect(output.entities?.[0].index.end).toEqual(11)
    expect(
      output.text.slice(
        output.entities?.[0].index.start,
        output.entities?.[0].index.end,
      ),
    ).toEqual('lltesto w')
  })

  it('correctly adjusts entities (scenario C - after)', () => {
    const output = input.clone().insert(8, 'test')
    expect(output.text).toEqual('hello wotestrld')
    expect(output.entities?.[0].index.start).toEqual(2)
    expect(output.entities?.[0].index.end).toEqual(7)
    expect(
      output.text.slice(
        output.entities?.[0].index.start,
        output.entities?.[0].index.end,
      ),
    ).toEqual('llo w')
  })
})

describe('richText.delete', () => {
  const input = new RichText('hello world', [
    {index: {start: 2, end: 7}, type: '', value: ''},
  ])

  it('correctly adjusts entities (scenario A - entirely outer)', () => {
    const output = input.clone().delete(0, 9)
    expect(output.text).toEqual('ld')
    expect(output.entities?.length).toEqual(0)
  })

  it('correctly adjusts entities (scenario B - entirely after)', () => {
    const output = input.clone().delete(7, 11)
    expect(output.text).toEqual('hello w')
    expect(output.entities?.[0].index.start).toEqual(2)
    expect(output.entities?.[0].index.end).toEqual(7)
    expect(
      output.text.slice(
        output.entities?.[0].index.start,
        output.entities?.[0].index.end,
      ),
    ).toEqual('llo w')
  })

  it('correctly adjusts entities (scenario C - partially after)', () => {
    const output = input.clone().delete(4, 11)
    expect(output.text).toEqual('hell')
    expect(output.entities?.[0].index.start).toEqual(2)
    expect(output.entities?.[0].index.end).toEqual(4)
    expect(
      output.text.slice(
        output.entities?.[0].index.start,
        output.entities?.[0].index.end,
      ),
    ).toEqual('ll')
  })

  it('correctly adjusts entities (scenario D - entirely inner)', () => {
    const output = input.clone().delete(3, 5)
    expect(output.text).toEqual('hel world')
    expect(output.entities?.[0].index.start).toEqual(2)
    expect(output.entities?.[0].index.end).toEqual(5)
    expect(
      output.text.slice(
        output.entities?.[0].index.start,
        output.entities?.[0].index.end,
      ),
    ).toEqual('l w')
  })

  it('correctly adjusts entities (scenario E - partially before)', () => {
    const output = input.clone().delete(1, 5)
    expect(output.text).toEqual('h world')
    expect(output.entities?.[0].index.start).toEqual(1)
    expect(output.entities?.[0].index.end).toEqual(3)
    expect(
      output.text.slice(
        output.entities?.[0].index.start,
        output.entities?.[0].index.end,
      ),
    ).toEqual(' w')
  })

  it('correctly adjusts entities (scenario F - entirely before)', () => {
    const output = input.clone().delete(0, 2)
    expect(output.text).toEqual('llo world')
    expect(output.entities?.[0].index.start).toEqual(0)
    expect(output.entities?.[0].index.end).toEqual(5)
    expect(
      output.text.slice(
        output.entities?.[0].index.start,
        output.entities?.[0].index.end,
      ),
    ).toEqual('llo w')
  })
})
