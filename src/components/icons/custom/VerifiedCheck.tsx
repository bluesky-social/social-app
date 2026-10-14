import {createSVG} from '#/components/icons/TEMPLATE'

/**
 * Hand-maintained from `assets/icons/custom/VerifiedCheck.svg`. This icon is custom
 * because its fixed white tick is a second paint role that a
 * single glyph path cannot carry. It is neither generated from the
 * SVG nor drawn from an icon font.
 */
export const VerifiedCheck = createSVG({
  elements: [
    {
      fill: 'currentColor',
      stroke: 'none',
      type: 'circle',
      cx: 12,
      cy: 12,
      r: 11.5,
    },
    {
      fill: '#fff',
      stroke: 'none',
      type: 'path',
      d: 'M17.659 8.175a1.36 1.36 0 0 1 0 1.925l-6.224 6.223a1.36 1.36 0 0 1-1.925 0L6.4 13.212a1.361 1.361 0 0 1 1.925-1.925l2.149 2.148 5.26-5.26a1.36 1.36 0 0 1 1.925 0Z',
      fillRule: 'evenodd',
      clipRule: 'evenodd',
    },
  ],
  viewBox: '0 0 24 24',
})
