import React, {memo, useRef, useState} from 'react'
import {TextInput, View} from 'react-native'
import {AppBskyActorDefs, AppBskyFeedPost, AtUri} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {EMBED_SCRIPT} from '#/lib/constants'
import {niceDate} from '#/lib/strings/time'
import {toShareUrl} from '#/lib/strings/url-helpers'
import {atoms as a, useTheme} from '#/alf'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {CodeBrackets_Stroke2_Corner0_Rounded as CodeBrackets} from '#/components/icons/CodeBrackets'
import {Text} from '#/components/Typography'
import {Button, ButtonIcon, ButtonText} from '../Button'

type EmbedDialogProps = {
  control: Dialog.DialogControlProps
  postAuthor: AppBskyActorDefs.ProfileViewBasic
  postCid: string
  postUri: string
  record: AppBskyFeedPost.Record
  timestamp: string
}

let EmbedDialog = ({control, ...rest}: EmbedDialogProps): React.ReactNode => {
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <EmbedDialogInner {...rest} />
    </Dialog.Outer>
  )
}
EmbedDialog = memo(EmbedDialog)
export {EmbedDialog}

function EmbedDialogInner({
  postAuthor,
  postCid,
  postUri,
  record,
  timestamp,
}: Omit<EmbedDialogProps, 'control'>) {
  const t = useTheme()
  const {_, i18n} = useLingui()
  const ref = useRef<TextInput>(null)
  const [copied, setCopied] = useState(false)

  // reset copied state after 2 seconds
  React.useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => {
        setCopied(false)
      }, 2000)
      return () => clearTimeout(timeout)
    }
  }, [copied])

  const snippet = React.useMemo(() => {
    function toEmbedUrl(href: string) {
      return toShareUrl(href) + '?ref_src=embed'
    }

    const lang = record.langs && record.langs.length > 0 ? record.langs[0] : ''
    const profileHref = toEmbedUrl(['/profile', postAuthor.did].join('/'))
    const urip = new AtUri(postUri)
    const href = toEmbedUrl(
      ['/profile', postAuthor.did, 'post', urip.rkey].join('/'),
    )

    // x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x
    // DO NOT ADD ANY NEW INTERPOLATIONS BELOW WITHOUT ESCAPING THEM!
    // Also, keep this code synced with the bskyembed code in landing.tsx.
    // x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x
    return `<blockquote class="bluesky-embed" data-bluesky-uri="${escapeHtml(
      postUri,
    )}" data-bluesky-cid="${escapeHtml(postCid)}"><p lang="${escapeHtml(
      lang,
    )}">${escapeHtml(record.text)}${
      record.embed
        ? `<br><br><a href="${escapeHtml(href)}">[image or embed]</a>`
        : ''
    }</p>&mdash; ${escapeHtml(
      postAuthor.displayName || postAuthor.handle,
    )} (<a href="${escapeHtml(profileHref)}">@${escapeHtml(
      postAuthor.handle,
    )}</a>) <a href="${escapeHtml(href)}">${escapeHtml(
      niceDate(i18n, timestamp),
    )}</a></blockquote><script async src="${EMBED_SCRIPT}" charset="utf-8"></script>`
  }, [i18n, postUri, postCid, record, timestamp, postAuthor])

  return (
    <Dialog.Inner label="Embed post" style={[a.gap_md, {maxWidth: 500}]}>
      <View style={[a.gap_sm, a.pb_lg]}>
        <Text style={[a.text_2xl, a.font_bold]}>
          <Trans>Embed post</Trans>
        </Text>
        <Text
          style={[a.text_md, t.atoms.text_contrast_medium, a.leading_normal]}>
          <Trans>
            Embed this post in your website. Simply copy the following snippet
            and paste it into the HTML code of your website.
          </Trans>
        </Text>
      </View>

      <View style={[a.flex_row, a.gap_sm]}>
        <View style={[a.flex_1]}>
          <TextField.Root>
            <TextField.Icon icon={CodeBrackets} />
            <TextField.Input
              label={_(msg`Embed HTML code`)}
              editable={false}
              selection={{start: 0, end: snippet.length}}
              value={snippet}
              style={{}}
            />
          </TextField.Root>
        </View>
        <Button
          label={_(msg`Copy code`)}
          color="primary"
          variant="solid"
          size="large"
          onPress={() => {
            ref.current?.focus()
            ref.current?.setSelection(0, snippet.length)
            navigator.clipboard.writeText(snippet)
            setCopied(true)
          }}>
          {copied ? (
            <>
              <ButtonIcon icon={Check} />
              <ButtonText>
                <Trans>Copied!</Trans>
              </ButtonText>
            </>
          ) : (
            <ButtonText>
              <Trans>Copy code</Trans>
            </ButtonText>
          )}
        </Button>
      </View>
      <Dialog.Close />
    </Dialog.Inner>
  )
}

/**
 * Based on a snippet of code from React, which itself was based on the escape-html library.
 * Copyright (c) Meta Platforms, Inc. and affiliates
 * Copyright (c) 2012-2013 TJ Holowaychuk
 * Copyright (c) 2015 Andreas Lubbe
 * Copyright (c) 2015 Tiancheng "Timothy" Gu
 * Licensed as MIT.
 */
const matchHtmlRegExp = /["'&<>]/
function escapeHtml(string: string) {
  const str = String(string)
  const match = matchHtmlRegExp.exec(str)
  if (!match) {
    return str
  }
  let escape
  let html = ''
  let index
  let lastIndex = 0
  for (index = match.index; index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 34: // "
        escape = '&quot;'
        break
      case 38: // &
        escape = '&amp;'
        break
      case 39: // '
        escape = '&#x27;'
        break
      case 60: // <
        escape = '&lt;'
        break
      case 62: // >
        escape = '&gt;'
        break
      default:
        continue
    }
    if (lastIndex !== index) {
      html += str.slice(lastIndex, index)
    }
    lastIndex = index + 1
    html += escape
  }
  return lastIndex !== index ? html + str.slice(lastIndex, index) : html
}
