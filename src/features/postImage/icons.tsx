import {createSinglePathSVG} from '#/components/icons/TEMPLATE'

/**
 * A sun, drawn to match the app's 2px rounded icons (like Moon) since the
 * icon set has none.
 */
export const Sun_Stroke2_Corner0_Rounded = createSinglePathSVG({
  path: 'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8ZM12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
})

/** Darrin's download icon: an arrow into a tray, at the app's 2px weight. */
export const Download_Stroke2_Corner2_Rounded = createSinglePathSVG({
  path: 'M3 18V15C3 14.4477 3.44772 14 4 14C4.55228 14 5 14.4477 5 15V18C5 18.5523 5.44771 19 6 19H18C18.5523 19 19 18.5523 19 18V15C19 14.4477 19.4477 14 20 14C20.5523 14 21 14.4477 21 15V18C21 19.6569 19.6569 21 18 21H6C4.34315 21 3 19.6569 3 18ZM11 4C11 3.44772 11.4477 3 12 3C12.5523 3 13 3.44772 13 4V12.0859L14.793 10.293C15.1835 9.90244 15.8165 9.90244 16.207 10.293C16.5976 10.6835 16.5976 11.3165 16.207 11.707L12.707 15.207C12.3165 15.5976 11.6835 15.5976 11.293 15.207L7.79297 11.707C7.40244 11.3165 7.40244 10.6835 7.79297 10.293C8.18349 9.90244 8.81651 9.90244 9.20703 10.293L11 12.0859V4Z',
})
