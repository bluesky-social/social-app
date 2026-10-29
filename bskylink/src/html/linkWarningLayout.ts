import {atoms as a, themes} from '@bsky.app/alf/core.js'
import escapeHTML from 'escape-html'
import {h} from 'hyposcript'

import {createGlobal, css, flush} from './styles.js'

const t = themes.light

const globalStyles = createGlobal({
  'html, body': {
    ...a.m_0,
    ...a.font_normal,
    ...a.leading_relaxed,
    fontFamily: '-apple-system, system-ui, BlinkMacSystemFont, sans-serif',
    fontSize: '100%',
    WebkitFontSmoothing: 'antialiased',
  },
  body: {
    ...a.flex,
    ...a.align_center,
    ...a.justify_center,
    ...a.p_xl,
    ...t.atoms.bg,
    ...t.atoms.text,
    minHeight: '100vh',
  },
  '*, *::before, *::after': {
    ...a.m_0,
    ...a.p_0,
    boxSizing: 'border-box',
  },
  'a, button, [role="button"]': {
    ...a.p_0,
    display: 'inline-block',
    touchAction: 'manipulation',
    textDecoration: 'none',
  },
  button: {
    ...a.border_0,
    ...a.rounded_0,
    ...a.pointer,
    backgroundColor: 'transparent',
    color: 'inherit',
    font: 'inherit',
    WebkitAppearance: 'none',
  },
})

export function linkWarningLayout(
  title: string,
  containerContents: string,
): string {
  const body = h(
    'body',
    {},
    h(
      'div',
      {
        class: css({
          ...a.w_full,
          ...a.text_center,
          maxWidth: 320,
        }),
      },
      containerContents,
    ),
  )
  const stylesheet = globalStyles + flush()

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta
          http-equiv="Cache-Control"
          content="no-store, no-cache, must-revalidate, max-age=0" />
        <meta http-equiv="Pragma" content="no-cache" />
        <meta http-equiv="Expires" content="0" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="apple-touch-icon" sizes="180x180" href="https://web-cdn.bsky.app/static/apple-touch-icon.png">
        <link rel="icon" type="image/png" sizes="32x32" href="https://web-cdn.bsky.app/static/favicon-32x32.png">
        <link rel="icon" type="image/png" sizes="16x16" href="https://web-cdn.bsky.app/static/favicon-16x16.png">
        <link rel="mask-icon" href="https://web-cdn.bsky.app/static/safari-pinned-tab.svg" color="#1185fe">
        <meta name="theme-color">
        <meta name="application-name" content="Bluesky">
        <meta name="generator" content="bskyweb">
        <meta property="og:site_name" content="Bluesky Social">
        <meta property="og:logo" content="https://web-cdn.bsky.app/static/favicon.png">
        <meta name="twitter:site" content="@bluesky" />

        <title>${escapeHTML(title)}</title>
        <style>${stylesheet}</style>
      </head>
      ${body}
    </html>
  `
}
