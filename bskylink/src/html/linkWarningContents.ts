import escapeHTML from 'escape-html'
import {type Request} from 'express'
import {type Hole, html} from 'uhtml'

export function linkWarningContents(
  req: Request,
  opts: {
    type: 'warn' | 'block'
    link: string
  },
): Hole {
  return html`
    <div class="warning-icon">⚠️</div>
    <h1>
      ${opts.type === 'warn'
        ? req.__('Potentially Dangerous Link')
        : req.__('Blocked Link')}
    </h1>
    <p class="warning-text">
      ${opts.type === 'warn'
        ? req.__(
            'This link may be malicious. You should proceed at your own risk.',
          )
        : req.__(
            'This link has been identified as malicious and has blocked for your safety.',
          )}
    </p>
    <div class="blocked-site">
      <p class="site-url">${escapeHTML(opts.link)}</p>
    </div>
    <div class="button-group">
      ${opts.type === 'warn'
        ? html`<a class="button secondary" href="${escapeHTML(opts.link)}"
            >${req.__('Continue Anyway')}</a
          >`
        : null}
      <a class="button primary" href="https://bsky.app"
        >${req.__('Return to Bluesky')}</a
      >
    </div>
  `
}
