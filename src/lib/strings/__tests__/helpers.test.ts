import {countLines} from '#/lib/strings/helpers'

describe('countLines', () => {
  it.each([
    [undefined, 0],
    ['', 0],
    ['one line', 0],
    ['one\ntwo\n', 2],
    ['one\r\ntwo\r\n', 2],
    ['one\rtwo\r', 2],
    ['one\r\ntwo\rthree\nfour', 3],
    ['one\u2028two\u2029three', 0],
  ])('counts physical boundaries in %p', (text, expected) => {
    expect(countLines(text)).toBe(expected)
  })
})
