import escapeHTML from 'escape-html'

export function linkRedirectContents(link: string): string {
  return `
    <html>
      <head>
        <meta http-equiv="refresh" content="0; URL='${escapeHTML(link)}'" />
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
