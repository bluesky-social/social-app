import escapeHTML from 'escape-html'

export function linkRedirectContents(link: string): string {
  // Encode characters that could break out of the single-quoted URL in meta refresh.
  // HTML entity escaping (&#39;) is insufficient because the browser decodes entities
  // before the meta refresh parser processes the URL, allowing apostrophes to
  // prematurely terminate the URL string.
  //
  // Example: "They're" with HTML escaping becomes "They&#39;re" in HTML, but after
  // the browser decodes the content attribute, the meta refresh parser sees "They're"
  // and interprets the apostrophe as the closing quote, truncating the URL to "They".
  const safeLink = link.replace(/'/g, '%27')

  return `
    <html>
      <head>
        <meta http-equiv="refresh" content="0; URL='${escapeHTML(safeLink)}'" />
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
