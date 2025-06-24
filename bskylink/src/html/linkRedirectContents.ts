import {type Hole, html} from 'uhtml'

export function linkRedirectContents(link: string): Hole {
  return html`
    <html>
      <head>
        <meta http-equiv="refresh" content="0; URL='${link}'" />
        <meta
          http-equiv="Cache-Control"
          content="no-store, no-cache, must-revalidate, max-age=0" />
        <meta http-equiv="Pragma" content="no-cache" />
        <meta http-equiv="Expires" content="0" />
        <style>
          :root {
            color-scheme: light dark;
          }
        </style>
      </head>
    </html>
  `
}
