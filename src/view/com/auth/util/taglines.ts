import {t} from '@lingui/macro'

export function getTagline() {
  const taglines = [
    t`"We do things a little differently around here." - blue sky`,
    t`This is blue sky. Keep your fucking baby bullshit on fucking X or get Smoked like the rest of them.`,
    t`You can show your penis here. But you must never fuck`,
  ]

  return taglines[Math.floor(Math.random() * taglines.length)]
}
