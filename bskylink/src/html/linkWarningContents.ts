import {atoms as a, themes} from '@bsky.app/alf'
import escapeHTML from 'escape-html'
import {type Request} from 'express'
import {h} from 'hyposcript'

import {css} from './styles.js'

const t = themes.light
const button = {
  ...a.w_full,
  ...a.py_sm,
  ...a.px_2xl,
  ...a.text_md,
  ...a.font_semi_bold,
  ...a.border_0,
  ...a.rounded_full,
  ...a.pointer,
  transition: 'background-color 0.2s',
}

export function linkWarningContents(
  req: Request,
  opts: {
    type: 'warn' | 'block'
    link: string
  },
): string {
  const link = escapeHTML(opts.link)

  return [
    h('div', {class: css({...a.pb_md, ...a.text_3xl})}, '⚠️'),
    h(
      'h1',
      {
        class: css({
          ...a.pb_xs,
          ...a.text_2xl,
          ...a.font_bold,
          ...t.atoms.text,
        }),
      },
      opts.type === 'warn'
        ? req.__('Potentially Dangerous Link')
        : req.__('Blocked Link'),
    ),
    h(
      'p',
      {
        class: css({
          ...a.pb_lg,
          ...a.text_md,
          ...a.leading_snug,
          ...t.atoms.text_contrast_medium,
        }),
      },
      opts.type === 'warn'
        ? req.__(
            'This link may be malicious. You should proceed at your own risk.',
          )
        : req.__(
            'This link has been identified as malicious and has been blocked for your safety.',
          ),
    ),
    h(
      'div',
      {
        class: css({
          ...a.mb_xl,
          ...a.rounded_md,
          ...t.atoms.bg_contrast_50,
          padding: a.p_lg.padding,
          wordBreak: 'break-all',
        }),
      },
      h(
        'p',
        {
          class: css({
            ...a.text_sm,
            ...a.text_center,
            ...t.atoms.text_contrast_medium,
            fontFamily: 'monospace',
            wordBreak: 'break-all',
          }),
        },
        link,
      ),
    ),
    h(
      'div',
      {},
      h(
        'a',
        {
          role: 'button',
          class: css({
            ...button,
            ...t.atoms.text_inverted,
            backgroundColor: t.palette.primary_500,
            '&:hover': {backgroundColor: t.palette.primary_600},
            '&:active': {backgroundColor: t.palette.primary_700},
          }),
          href: 'https://bsky.app',
        },
        req.__('Return to Bluesky'),
      ),
      opts.type === 'warn' &&
        h(
          'a',
          {
            class: css({
              ...button,
              ...a.mt_sm,
              color: t.palette.negative_600,
              backgroundColor: t.palette.negative_50,
              '&:hover': {backgroundColor: t.palette.negative_100},
              '&:active': {backgroundColor: t.palette.negative_100},
            }),
            href: link,
          },
          req.__('Continue Anyway'),
        ),
    ),
  ].join('')
}
