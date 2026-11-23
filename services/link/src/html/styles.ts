import {hypostyle} from 'hypostyle'

/** Adds units to ALF lengths that Hypostyle otherwise leaves unitless. */
function pixels(value: string | number) {
  return typeof value === 'number' ? `${value}px` : value
}

export const {css, createGlobal, flush} = hypostyle({
  breakpoints: ['481px'],
  properties: {
    fontSize: {unit: pixels},
    letterSpacing: {unit: pixels},
    borderRadius: {unit: pixels},
  },
})
