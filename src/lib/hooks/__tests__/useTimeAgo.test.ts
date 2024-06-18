import {describe, expect, it} from '@jest/globals'
import {MessageDescriptor} from '@lingui/core'
import {addDays, subDays, subHours, subMinutes, subSeconds} from 'date-fns'

import {dateDiff} from '../useTimeAgo'

const lingui: any = (obj: MessageDescriptor) => obj.message

const base = new Date('2024-06-17T00:00:00Z')

describe('dateDiff', () => {
  it(`works with numbers`, () => {
    expect(dateDiff(subDays(base, 3), Number(base), {lingui})).toEqual('3d')
  })
  it(`works with strings`, () => {
    expect(dateDiff(subDays(base, 3), base.toString(), {lingui})).toEqual('3d')
  })
  it(`works with dates`, () => {
    expect(dateDiff(subDays(base, 3), base, {lingui})).toEqual('3d')
  })

  it(`equal values return now`, () => {
    expect(dateDiff(base, base, {lingui})).toEqual('now')
  })
  it(`future dates return now`, () => {
    expect(dateDiff(addDays(base, 3), base, {lingui})).toEqual('now')
  })

  it(`values < 5 seconds ago return now`, () => {
    const then = subSeconds(base, 4)
    expect(dateDiff(then, base, {lingui})).toEqual('now')
  })
  it(`values >= 5 seconds ago return seconds`, () => {
    const then = subSeconds(base, 5)
    expect(dateDiff(then, base, {lingui})).toEqual('5s')
  })

  it(`values < 1 min return seconds`, () => {
    const then = subSeconds(base, 59)
    expect(dateDiff(then, base, {lingui})).toEqual('59s')
  })
  it(`values >= 1 min return minutes`, () => {
    const then = subSeconds(base, 60)
    expect(dateDiff(then, base, {lingui})).toEqual('1m')
  })
  it(`minutes round down`, () => {
    const then = subSeconds(base, 119)
    expect(dateDiff(then, base, {lingui})).toEqual('1m')
  })

  it(`values < 1 hour return minutes`, () => {
    const then = subMinutes(base, 59)
    expect(dateDiff(then, base, {lingui})).toEqual('59m')
  })
  it(`values >= 1 hour return hours`, () => {
    const then = subMinutes(base, 60)
    expect(dateDiff(then, base, {lingui})).toEqual('1h')
  })
  it(`hours round down`, () => {
    const then = subMinutes(base, 119)
    expect(dateDiff(then, base, {lingui})).toEqual('1h')
  })

  it(`values < 1 day return hours`, () => {
    const then = subHours(base, 23)
    expect(dateDiff(then, base, {lingui})).toEqual('23h')
  })
  it(`values >= 1 day return days`, () => {
    const then = subHours(base, 24)
    expect(dateDiff(then, base, {lingui})).toEqual('1d')
  })
  it(`days round down`, () => {
    const then = subHours(base, 47)
    expect(dateDiff(then, base, {lingui})).toEqual('1d')
  })

  it(`values < 30 days return days`, () => {
    const then = subDays(base, 29)
    expect(dateDiff(then, base, {lingui})).toEqual('29d')
  })
  it(`values >= 30 days return months`, () => {
    const then = subDays(base, 30)
    expect(dateDiff(then, base, {lingui})).toEqual('1mo')
  })
  it(`months round down`, () => {
    const then = subDays(base, 59)
    expect(dateDiff(then, base, {lingui})).toEqual('1mo')
  })
  it(`values are rounded by increments of 30`, () => {
    const then = subDays(base, 61)
    expect(dateDiff(then, base, {lingui})).toEqual('2mo')
  })

  it(`values < 360 days return months`, () => {
    const then = subDays(base, 359)
    expect(dateDiff(then, base, {lingui})).toEqual('11mo')
  })
  it(`values >= 360 days return the earlier value`, () => {
    const then = subDays(base, 360)
    expect(dateDiff(then, base, {lingui})).toEqual(then.toLocaleDateString())
  })
})
