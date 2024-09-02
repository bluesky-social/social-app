import {describe, expect, it} from '@jest/globals'
import {addDays, subDays, subHours, subMinutes, subSeconds} from 'date-fns'

import {dateDiff} from '../useTimeAgo'

const base = new Date('2024-06-17T00:00:00Z')

describe('dateDiff', () => {
  it(`works with numbers`, () => {
    const earlier = subDays(base, 3)
    expect(dateDiff(earlier, Number(base))).toEqual({
      value: 3,
      unit: 'day',
      earlier,
      later: base,
    })
  })
  it(`works with strings`, () => {
    const earlier = subDays(base, 3)
    expect(dateDiff(earlier, base.toString())).toEqual({
      value: 3,
      unit: 'day',
      earlier,
      later: base,
    })
  })
  it(`works with dates`, () => {
    const earlier = subDays(base, 3)
    expect(dateDiff(earlier, base)).toEqual({
      value: 3,
      unit: 'day',
      earlier,
      later: base,
    })
  })

  it(`equal values return now`, () => {
    expect(dateDiff(base, base)).toEqual({
      value: 0,
      unit: 'now',
      earlier: base,
      later: base,
    })
  })
  it(`future dates return now`, () => {
    const earlier = addDays(base, 3)
    expect(dateDiff(earlier, base)).toEqual({
      value: 0,
      unit: 'now',
      earlier,
      later: base,
    })
  })

  it(`values < 5 seconds ago return now`, () => {
    const then = subSeconds(base, 4)
    expect(dateDiff(then, base)).toEqual({
      value: 0,
      unit: 'now',
      earlier: then,
      later: base,
    })
  })
  it(`values >= 5 seconds ago return seconds`, () => {
    const then = subSeconds(base, 5)
    expect(dateDiff(then, base)).toEqual({
      value: 5,
      unit: 'second',
      earlier: then,
      later: base,
    })
  })

  it(`values < 1 min return seconds`, () => {
    const then = subSeconds(base, 59)
    expect(dateDiff(then, base)).toEqual({
      value: 59,
      unit: 'second',
      earlier: then,
      later: base,
    })
  })
  it(`values >= 1 min return minutes`, () => {
    const then = subSeconds(base, 60)
    expect(dateDiff(then, base)).toEqual({
      value: 1,
      unit: 'minute',
      earlier: then,
      later: base,
    })
  })
  it(`minutes round down`, () => {
    const then = subSeconds(base, 119)
    expect(dateDiff(then, base)).toEqual({
      value: 1,
      unit: 'minute',
      earlier: then,
      later: base,
    })
  })

  it(`values < 1 hour return minutes`, () => {
    const then = subMinutes(base, 59)
    expect(dateDiff(then, base)).toEqual({
      value: 59,
      unit: 'minute',
      earlier: then,
      later: base,
    })
  })
  it(`values >= 1 hour return hours`, () => {
    const then = subMinutes(base, 60)
    expect(dateDiff(then, base)).toEqual({
      value: 1,
      unit: 'hour',
      earlier: then,
      later: base,
    })
  })
  it(`hours round down`, () => {
    const then = subMinutes(base, 119)
    expect(dateDiff(then, base)).toEqual({
      value: 1,
      unit: 'hour',
      earlier: then,
      later: base,
    })
  })

  it(`values < 1 day return hours`, () => {
    const then = subHours(base, 23)
    expect(dateDiff(then, base)).toEqual({
      value: 23,
      unit: 'hour',
      earlier: then,
      later: base,
    })
  })
  it(`values >= 1 day return days`, () => {
    const then = subHours(base, 24)
    expect(dateDiff(then, base)).toEqual({
      value: 1,
      unit: 'day',
      earlier: then,
      later: base,
    })
  })
  it(`days round down`, () => {
    const then = subHours(base, 47)
    expect(dateDiff(then, base)).toEqual({
      value: 1,
      unit: 'day',
      earlier: then,
      later: base,
    })
  })

  it(`values < 30 days return days`, () => {
    const then = subDays(base, 29)
    expect(dateDiff(then, base)).toEqual({
      value: 29,
      unit: 'day',
      earlier: then,
      later: base,
    })
  })
  it(`values >= 30 days return months`, () => {
    const then = subDays(base, 30)
    expect(dateDiff(then, base)).toEqual({
      value: 1,
      unit: 'month',
      earlier: then,
      later: base,
    })
  })
  it(`months round down`, () => {
    const then = subDays(base, 59)
    expect(dateDiff(then, base)).toEqual({
      value: 1,
      unit: 'month',
      earlier: then,
      later: base,
    })
  })
  it(`values are rounded by increments of 30`, () => {
    const then = subDays(base, 61)
    expect(dateDiff(then, base)).toEqual({
      value: 2,
      unit: 'month',
      earlier: then,
      later: base,
    })
  })

  it(`values < 360 days return months`, () => {
    const then = subDays(base, 359)
    expect(dateDiff(then, base)).toEqual({
      value: 11,
      unit: 'month',
      earlier: then,
      later: base,
    })
  })
  it(`values >= 360 days return the earlier value`, () => {
    const then = subDays(base, 360)
    expect(dateDiff(then, base)).toEqual({
      value: 12,
      unit: 'month',
      earlier: then,
      later: base,
    })
  })
})
