import {type Hole, html} from 'uhtml'

export function linkWarningContents(opts: {
  type: 'warn' | 'block'
  link: string
}): Hole {
  return html`
    <div class="warning-icon">⚠️</div>
    <h1>
      ${opts.type === 'warn' ? 'Potentially Dangerous Link' : 'Blocked Link'}
    </h1>
    <p class="warning-text">
      ${opts.type === 'warn'
        ? 'This link may be malicious. You should proceed at your own risk.'
        : 'This link has been identified as malicious and has blocked for your safety.'}
    </p>
    <div class="blocked-site">
      <p class="site-url">${opts.link}</p>
    </div>
    <div class="button-group">
      ${opts.type === 'warn'
        ? html`<a class="button secondary" href="${opts.link}"
            >Continue Anyway</a
          >`
        : null}
      <a class="button primary" href="https://bsky.app">Return to Bluesky</a>
    </div>
  `
}
