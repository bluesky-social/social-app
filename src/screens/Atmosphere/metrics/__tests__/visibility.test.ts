import {Dimensions} from 'react-native'
import {act, renderHook} from '@testing-library/react-native'

import {useIsVisible} from '../visibility'

type Box = {left: number; top: number; right: number; bottom: number}

function domRect(box: Box) {
  return {...box, width: box.right - box.left, height: box.bottom - box.top}
}

function node(tagName: string, rect: Box, parentElement: unknown = null) {
  return {tagName, parentElement, getBoundingClientRect: () => domRect(rect)}
}

const WINDOW = {left: 0, top: 0, right: 1000, bottom: 1000}

/** A card in a carousel, in a vertical list, in the window. */
function cardIn({carousel, card}: {carousel: Box; card: Box}) {
  const list = node('RN:ScrollView', WINDOW)
  const row = node('RN:ScrollView', carousel, node('RN:View', WINDOW, list))
  return node('RN:View', card, node('RN:View', card, row))
}

function isVisible(card: unknown) {
  const {result} = renderHook(() =>
    useIsVisible({current: card} as never, true),
  )
  return result.current
}

beforeEach(() => {
  jest.useFakeTimers()
  jest
    .spyOn(Dimensions, 'get')
    .mockReturnValue({width: 1000, height: 1000, scale: 1, fontScale: 1})
})

afterEach(() => {
  jest.useRealTimers()
})

it('counts a card mostly within its carousel', () => {
  const carousel = {left: 200, top: 0, right: 800, bottom: 300}
  expect(
    isVisible(
      cardIn({carousel, card: {left: 500, top: 0, right: 900, bottom: 300}}),
    ),
  ).toBe(true)
})

it("doesn't count a card in the window but past its carousel's edge", () => {
  const carousel = {left: 200, top: 0, right: 800, bottom: 300}
  expect(
    isVisible(
      cardIn({carousel, card: {left: 810, top: 0, right: 990, bottom: 300}}),
    ),
  ).toBe(false)
  expect(
    isVisible(
      cardIn({carousel, card: {left: 650, top: 0, right: 990, bottom: 300}}),
    ),
  ).toBe(false)
})

it("doesn't count a card scrolled out of its list", () => {
  const list = node('RN:ScrollView', {
    left: 0,
    top: 100,
    right: 1000,
    bottom: 900,
  })
  const card = node(
    'RN:View',
    {left: 0, top: 850, right: 1000, bottom: 1000},
    list,
  )
  expect(isVisible(card)).toBe(false)
})

it('rechecks as the card scrolls into view', () => {
  let rect = {left: 810, top: 0, right: 990, bottom: 300}
  const row = node('RN:ScrollView', {
    left: 200,
    top: 0,
    right: 800,
    bottom: 300,
  })
  const card = {
    tagName: 'RN:View',
    parentElement: row,
    getBoundingClientRect: () => domRect(rect),
  }
  const {result} = renderHook(() =>
    useIsVisible({current: card} as never, true),
  )
  expect(result.current).toBe(false)

  rect = {left: 400, top: 0, right: 580, bottom: 300}
  act(() => jest.advanceTimersByTime(250))
  expect(result.current).toBe(true)
})
